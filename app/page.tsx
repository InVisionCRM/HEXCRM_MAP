"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { GoogleMap, LoadScript, Marker, Polygon } from "@react-google-maps/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  MapPin,
  Search,
  Navigation,
  Calendar,
  Settings,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building,
} from "lucide-react"
import type { google } from "googlemaps"

// Components
import { PropertyDetails } from "@/components/property-details"
import { FollowUpModal, type FollowUpData } from "@/components/follow-up-modal"
import { CalendarView } from "@/components/calendar-view"
import { TerritoryManager } from "@/components/territory-manager"
import { OnboardingForm } from "@/components/onboarding-form"
import { SetupGuide } from "@/components/setup-guide"

// Utils and storage
import { offlineStorage } from "@/lib/offline-storage"
import type { Territory } from "@/lib/territory-storage"
import { pointInPolygon } from "@/lib/turf-utils"
import { geocodeAddress, reverseGeocode, getStreetViewImage } from "@/lib/maps-server"

interface Pin {
  id: string
  lat: number
  lng: number
  address: string
  placeId?: string
  propertyName?: string
  status: "visited" | "not-interested" | "follow-up" | "interested"
  timestamp: Date
  notes?: string
  customerInfo?: {
    name?: string
    phone?: string
    email?: string
  }
}

const mapContainerStyle = {
  width: "100%",
  height: "500px",
}

const defaultCenter = {
  lat: 40.7128,
  lng: -74.006,
}

const libraries: ("places" | "geometry" | "drawing")[] = ["places", "geometry"]

export default function Home() {
  // State management
  const [pins, setPins] = useState<Pin[]>([])
  const [followUps, setFollowUps] = useState<FollowUpData[]>([])
  const [territories, setTerritories] = useState<Territory[]>([])
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null)
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null)
  const [visibleTerritories, setVisibleTerritories] = useState<Set<string>>(new Set())
  const [searchAddress, setSearchAddress] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapCenter, setMapCenter] = useState(defaultCenter)
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false)
  const [streetViewUrl, setStreetViewUrl] = useState("")
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false)
  const [showSetupGuide, setShowSetupGuide] = useState(false)
  const [isApiKeyValid, setIsApiKeyValid] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("map")

  const { toast } = useToast()
  const mapRef = useRef<google.maps.Map | null>(null)

  // Load data on component mount
  useEffect(() => {
    loadInitialData()
  }, [])

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setCurrentLocation(location)
          setMapCenter(location)
        },
        (error) => {
          console.warn("Geolocation error:", error)
          toast({
            title: "Location Access",
            description: "Unable to get your current location. Using default location.",
            variant: "destructive",
          })
        },
      )
    }
  }, [toast])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)

      // Check if onboarding is complete
      const onboardingStatus = await offlineStorage.getSetting("onboarding-complete")
      setIsOnboardingComplete(!!onboardingStatus)

      // Check API key validity
      const apiKeyStatus = await offlineStorage.getSetting("api-key-valid")
      setIsApiKeyValid(!!apiKeyStatus)

      // Load pins and follow-ups
      const [loadedPins, loadedFollowUps] = await Promise.all([offlineStorage.getPins(), offlineStorage.getFollowUps()])

      setPins(
        loadedPins.map((pin) => ({
          ...pin,
          timestamp: new Date(pin.timestamp),
        })),
      )

      setFollowUps(
        loadedFollowUps.map((followUp) => ({
          ...followUp,
          date: new Date(followUp.date),
          createdAt: new Date(followUp.createdAt),
        })),
      )
    } catch (error) {
      console.error("Error loading initial data:", error)
      toast({
        title: "Error",
        description: "Failed to load saved data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMapClick = useCallback(
    async (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return

      const lat = event.latLng.lat()
      const lng = event.latLng.lng()

      try {
        // Reverse geocode to get address
        const geocodeResult = await reverseGeocode(lat, lng)

        const newPin: Pin = {
          id: crypto.randomUUID(),
          lat,
          lng,
          address: geocodeResult?.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          placeId: geocodeResult?.placeId,
          propertyName: geocodeResult?.propertyName,
          status: "visited",
          timestamp: new Date(),
        }

        // Save pin
        await offlineStorage.savePin(newPin)
        setPins((prev) => [...prev, newPin])

        // Check if pin is in any territory
        const containingTerritories = territories.filter((territory) =>
          pointInPolygon({ lat, lng }, territory.coordinates),
        )

        if (containingTerritories.length > 0) {
          toast({
            title: "Territory Match",
            description: `This location is in: ${containingTerritories.map((t) => t.name).join(", ")}`,
          })
        }

        // Load street view
        const streetView = await getStreetViewImage(lat, lng)
        setStreetViewUrl(streetView.url)
        setSelectedPin(newPin)
      } catch (error) {
        console.error("Error adding pin:", error)
        toast({
          title: "Error",
          description: "Failed to add location",
          variant: "destructive",
        })
      }
    },
    [territories, toast],
  )

  const handleSearch = async () => {
    if (!searchAddress.trim()) return

    try {
      const result = await geocodeAddress(searchAddress)
      if (result) {
        setMapCenter({ lat: result.lat, lng: result.lng })
        setSearchAddress("")
        toast({
          title: "Location Found",
          description: result.address,
        })
      } else {
        toast({
          title: "Not Found",
          description: "Could not find the specified address",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Search error:", error)
      toast({
        title: "Search Error",
        description: "Failed to search for address",
        variant: "destructive",
      })
    }
  }

  const handlePinStatusUpdate = async (pinId: string, status: Pin["status"], notes?: string) => {
    const updatedPins = pins.map((pin) => (pin.id === pinId ? { ...pin, status, notes, timestamp: new Date() } : pin))

    setPins(updatedPins)

    // Save to storage
    const updatedPin = updatedPins.find((p) => p.id === pinId)
    if (updatedPin) {
      await offlineStorage.savePin(updatedPin)
    }

    setSelectedPin(null)

    toast({
      title: "Status Updated",
      description: `Location marked as ${status.replace("-", " ")}`,
    })
  }

  const handleFollowUpSave = async (followUp: FollowUpData) => {
    await offlineStorage.saveFollowUp(followUp)
    setFollowUps((prev) => [...prev, followUp])
    setIsFollowUpModalOpen(false)

    toast({
      title: "Follow-up Scheduled",
      description: `Follow-up scheduled for ${followUp.date.toLocaleDateString()}`,
    })
  }

  const handleFollowUpUpdate = async (id: string, updates: Partial<FollowUpData>) => {
    const updatedFollowUps = followUps.map((f) => (f.id === id ? { ...f, ...updates } : f))
    setFollowUps(updatedFollowUps)

    // Save to storage
    const updatedFollowUp = updatedFollowUps.find((f) => f.id === id)
    if (updatedFollowUp) {
      await offlineStorage.saveFollowUp(updatedFollowUp)
    }
  }

  const handleOnboardingComplete = async (data: any) => {
    await offlineStorage.saveSetting("onboarding-complete", true)
    await offlineStorage.saveSetting("user-profile", data)
    setIsOnboardingComplete(true)

    toast({
      title: "Welcome!",
      description: "Your account has been set up successfully",
    })
  }

  const handleApiKeyValidated = async (isValid: boolean) => {
    setIsApiKeyValid(isValid)
    await offlineStorage.saveSetting("api-key-valid", isValid)

    if (isValid) {
      setShowSetupGuide(false)
      toast({
        title: "Setup Complete",
        description: "Google Maps API key validated successfully",
      })
    }
  }

  const getStatusIcon = (status: Pin["status"]) => {
    switch (status) {
      case "visited":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "not-interested":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "follow-up":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "interested":
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: Pin["status"]) => {
    switch (status) {
      case "visited":
        return "#10b981"
      case "not-interested":
        return "#ef4444"
      case "follow-up":
        return "#f59e0b"
      case "interested":
        return "#3b82f6"
      default:
        return "#6b7280"
    }
  }

  // Show onboarding if not complete
  if (!isOnboardingComplete) {
    return <OnboardingForm onComplete={handleOnboardingComplete} />
  }

  // Show setup guide if API key is not valid
  if (!isApiKeyValid || showSetupGuide) {
    return (
      <SetupGuide
        onApiKeyValidated={handleApiKeyValidated}
        currentApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your sales tracker...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">PulseChain Education Tracker</h1>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="outline" className="hidden sm:flex">
                {pins.length} Locations
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setShowSetupGuide(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Setup
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Map
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="territories" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Territories
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Map Tab */}
          <TabsContent value="map" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Map */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Sales Territory Map</CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Search address..."
                            value={searchAddress}
                            onChange={(e) => setSearchAddress(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                            className="w-64"
                          />
                          <Button size="sm" onClick={handleSearch}>
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => currentLocation && setMapCenter(currentLocation)}
                        >
                          <Navigation className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <LoadScript
                      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
                      libraries={libraries}
                    >
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={mapCenter}
                        zoom={13}
                        onClick={handleMapClick}
                        onLoad={(map) => {
                          mapRef.current = map
                        }}
                      >
                        {/* Current Location Marker */}
                        {currentLocation && (
                          <Marker
                            position={currentLocation}
                            icon={{
                              url:
                                "data:image/svg+xml;charset=UTF-8," +
                                encodeURIComponent(`
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8" cy="8" r="6" fill="#4285f4" stroke="#ffffff" strokeWidth="2"/>
        </svg>
      `),
                              scaledSize: { width: 16, height: 16 },
                              anchor: { x: 8, y: 8 },
                            }}
                          />
                        )}

                        {/* Pin Markers */}
                        {pins.map((pin) => (
                          <Marker
                            key={pin.id}
                            position={{ lat: pin.lat, lng: pin.lng }}
                            onClick={() => setSelectedPin(pin)}
                            icon={{
                              url:
                                "data:image/svg+xml;charset=UTF-8," +
                                encodeURIComponent(`
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="8" fill="${getStatusColor(pin.status)}" stroke="#ffffff" strokeWidth="2"/>
        </svg>
      `),
                              scaledSize: { width: 20, height: 20 },
                              anchor: { x: 10, y: 10 },
                            }}
                          />
                        ))}

                        {/* Territory Polygons */}
                        {territories
                          .filter((territory) => visibleTerritories.has(territory.id))
                          .map((territory) => (
                            <Polygon
                              key={territory.id}
                              paths={territory.coordinates}
                              options={{
                                fillColor: territory.color,
                                fillOpacity: 0.2,
                                strokeColor: territory.color,
                                strokeOpacity: 0.8,
                                strokeWeight: 2,
                              }}
                              onClick={() => setSelectedTerritory(territory)}
                            />
                          ))}
                      </GoogleMap>
                    </LoadScript>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Today's Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Visited</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {pins.filter((p) => p.status === "visited").length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Follow-ups</span>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                        {pins.filter((p) => p.status === "follow-up").length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Not Interested</span>
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        {pins.filter((p) => p.status === "not-interested").length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Interested</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {pins.filter((p) => p.status === "interested").length}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Territory Manager */}
                <TerritoryManager
                  selectedTerritoryId={selectedTerritory?.id}
                  onTerritorySelect={setSelectedTerritory}
                  visibleTerritories={visibleTerritories}
                  onToggleVisibility={(territoryId) => {
                    setVisibleTerritories((prev) => {
                      const newSet = new Set(prev)
                      if (newSet.has(territoryId)) {
                        newSet.delete(territoryId)
                      } else {
                        newSet.add(territoryId)
                      }
                      return newSet
                    })
                  }}
                />

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pins
                        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                        .slice(0, 5)
                        .map((pin) => (
                          <div key={pin.id} className="flex items-center gap-3 text-sm">
                            {getStatusIcon(pin.status)}
                            <div className="flex-1 min-w-0">
                              <p className="truncate">{pin.propertyName || pin.address}</p>
                              <p className="text-xs text-gray-500">{pin.timestamp.toLocaleTimeString()}</p>
                            </div>
                          </div>
                        ))}
                      {pins.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No activity yet. Click on the map to add locations.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <CalendarView followUps={followUps} onUpdateFollowUp={handleFollowUpUpdate} />
          </TabsContent>

          {/* Territories Tab */}
          <TabsContent value="territories">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TerritoryManager
                selectedTerritoryId={selectedTerritory?.id}
                onTerritorySelect={setSelectedTerritory}
                visibleTerritories={visibleTerritories}
                onToggleVisibility={(territoryId) => {
                  setVisibleTerritories((prev) => {
                    const newSet = new Set(prev)
                    if (newSet.has(territoryId)) {
                      newSet.delete(territoryId)
                    } else {
                      newSet.add(territoryId)
                    }
                    return newSet
                  })
                }}
              />

              {selectedTerritory && (
                <Card>
                  <CardHeader>
                    <CardTitle>Territory Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium">{selectedTerritory.name}</h3>
                        <p className="text-sm text-gray-600">{selectedTerritory.coordinates.length} boundary points</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Created:</span>
                          <p>{selectedTerritory.createdAt.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Updated:</span>
                          <p>{selectedTerritory.updatedAt.toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-600">Locations in territory:</span>
                        <p className="font-medium">
                          {
                            pins.filter((pin) =>
                              pointInPolygon({ lat: pin.lat, lng: pin.lng }, selectedTerritory.coordinates),
                            ).length
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Total Locations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pins.length}</div>
                  <p className="text-xs text-gray-600">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {pins.length > 0
                      ? Math.round((pins.filter((p) => p.status === "interested").length / pins.length) * 100)
                      : 0}
                    %
                  </div>
                  <p className="text-xs text-gray-600">Interested prospects</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Follow-ups</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{followUps.length}</div>
                  <p className="text-xs text-gray-600">Scheduled</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Territories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{territories.length}</div>
                  <p className="text-xs text-gray-600">Defined areas</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts would go here */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Analytics charts coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      {selectedPin && (
        <Dialog open={!!selectedPin} onOpenChange={() => setSelectedPin(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Location Details</DialogTitle>
            </DialogHeader>
            <PropertyDetails pin={selectedPin} streetViewUrl={streetViewUrl} />
            <div className="flex gap-2 pt-4">
              <Button onClick={() => handlePinStatusUpdate(selectedPin.id, "visited")} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Visited
              </Button>
              <Button variant="outline" onClick={() => setIsFollowUpModalOpen(true)} className="flex-1">
                <Clock className="h-4 w-4 mr-2" />
                Schedule Follow-up
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <FollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        onSave={handleFollowUpSave}
        pin={selectedPin || { id: "", address: "", propertyName: "" }}
      />
    </div>
  )
}
