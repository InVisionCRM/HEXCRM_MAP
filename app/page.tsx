"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  Home,
  UserX,
  Clock,
  CheckCircle,
  Plus,
  Navigation,
  Loader2,
  Calendar,
  Menu,
  Wifi,
  WifiOff,
} from "lucide-react"
import { OnboardingForm } from "@/components/onboarding-form"
import { FollowUpModal } from "@/components/follow-up-modal"
import { CalendarView } from "@/components/calendar-view"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { getGoogleMapsConfig, generateStreetViewUrl } from "@/lib/maps-server"
import { offlineStorage } from "@/lib/offline-storage"
import { usePWA } from "@/hooks/use-pwa"
import { toast } from "@/hooks/use-toast"

interface Pin {
  id: string
  lat: number
  lng: number
  address: string
  placeId?: string
  propertyName?: string
  status: "not-home" | "not-interested" | "follow-up" | "onboarded" | "new"
  timestamp: Date
  offline?: boolean
}

interface MarkerRef {
  id: string
  marker: any
}

interface OnboardData {
  firstName: string
  phone?: string
  email?: string
  ownsCrypto?: boolean
  socials: {
    twitter?: string
    telegram?: string
    reddit?: string
  }
  notes?: string
  pinId: string
  address: string
  timestamp: Date
  offline?: boolean
}

interface FollowUpData {
  id: string
  pinId: string
  address: string
  propertyName?: string
  date: string
  time: string
  notes?: string
  timestamp: Date
  offline?: boolean
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export default function PulseChainEducationTracker() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [pins, setPins] = useState<Pin[]>([])
  const [markers, setMarkers] = useState<MarkerRef[]>([])
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null)
  const [streetViewUrl, setStreetViewUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGpsLoading, setIsGpsLoading] = useState(false)
  const [usedAddresses, setUsedAddresses] = useState<Set<string>>(new Set())
  const [mapError, setMapError] = useState<string>("")
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showOnboardForm, setShowOnboardForm] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [showCalendarView, setShowCalendarView] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [currentOnboardData, setCurrentOnboardData] = useState<OnboardData | null>(null)
  const [onboardedCustomers, setOnboardedCustomers] = useState<OnboardData[]>([])
  const [followUps, setFollowUps] = useState<FollowUpData[]>([])
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const { isOnline } = usePWA()

  // Austin, Texas coordinates
  const austinCenter = { lat: 30.2672, lng: -97.7431 }

  useEffect(() => {
    // Initialize offline storage and load cached data
    const initializeApp = async () => {
      try {
        await offlineStorage.init()

        // Load cached data
        const cachedPins = await offlineStorage.getPins()
        const cachedFollowUps = await offlineStorage.getFollowUps()
        const cachedCustomers = await offlineStorage.getCustomers()

        if (cachedPins.length > 0) {
          setPins(cachedPins)
          setUsedAddresses(new Set(cachedPins.map((p) => p.address)))
        }

        if (cachedFollowUps.length > 0) {
          setFollowUps(cachedFollowUps)
        }

        if (cachedCustomers.length > 0) {
          setOnboardedCustomers(cachedCustomers)
        }

        console.log("Loaded cached data:", {
          pins: cachedPins.length,
          followUps: cachedFollowUps.length,
          customers: cachedCustomers.length,
        })
      } catch (error) {
        console.error("Error initializing offline storage:", error)
      }
    }

    initializeApp()
  }, [])

  useEffect(() => {
    const initializeGoogleMaps = async () => {
      if (!isOnline) {
        setMapError("You're offline. Maps functionality is limited.")
        return
      }

      try {
        const config = await getGoogleMapsConfig()

        if (!config.hasValidKey) {
          setMapError(config.error || "Failed to load Google Maps configuration")
          return
        }

        // Load Google Maps script with error handling
        const script = document.createElement("script")
        script.src = config.scriptUrl
        script.async = true
        script.defer = true

        // Handle script loading errors
        script.onerror = () => {
          setMapError("Failed to load Google Maps. Please check your internet connection.")
        }

        window.initMap = () => {
          try {
            initializeMap()
          } catch (error) {
            console.error("Map initialization error:", error)
            setMapError("Failed to initialize Google Maps. Please check your API key permissions.")
          }
        }

        document.head.appendChild(script)

        return () => {
          if (document.head.contains(script)) {
            document.head.removeChild(script)
          }
        }
      } catch (error) {
        console.error("Error initializing Google Maps:", error)
        setMapError("Failed to initialize Google Maps configuration.")
      }
    }

    initializeGoogleMaps()
  }, [isOnline])

  // Add cached pins to map when both map and pins are available
  useEffect(() => {
    if (map && pins.length > 0) {
      // Clear existing markers first
      markers.forEach((markerRef) => {
        if (markerRef.marker) {
          markerRef.marker.setMap(null)
        }
      })
      setMarkers([])

      // Add all pins to map
      const newMarkers: MarkerRef[] = []
      pins.forEach((pin) => {
        try {
          const marker = createMarker(pin, map)
          newMarkers.push({ id: pin.id, marker })
        } catch (error) {
          console.error("Error creating marker for pin:", pin.id, error)
        }
      })
      setMarkers(newMarkers)
      console.log(`Added ${newMarkers.length} markers to map`)
    }
  }, [map, pins.length]) // Depend on map and pins.length to trigger when either changes

  // Sync offline data when coming back online
  useEffect(() => {
    if (isOnline) {
      syncOfflineData()
    }
  }, [isOnline])

  const syncOfflineData = async () => {
    try {
      const offlineData = await offlineStorage.getOfflineData()

      if (offlineData.pins.length > 0 || offlineData.followUps.length > 0 || offlineData.customers.length > 0) {
        toast({
          title: "Syncing offline data...",
          description: `Syncing ${offlineData.pins.length} pins, ${offlineData.followUps.length} follow-ups, and ${offlineData.customers.length} customers`,
        })

        // Here you would sync with your backend API
        // For now, we'll just mark them as synced
        setTimeout(async () => {
          await offlineStorage.markAsSynced(
            "pins",
            offlineData.pins.map((p) => p.id),
          )
          await offlineStorage.markAsSynced(
            "followUps",
            offlineData.followUps.map((f) => f.id),
          )
          await offlineStorage.markAsSynced(
            "customers",
            offlineData.customers.map((c) => c.pinId),
          )

          toast({
            title: "Sync complete!",
            description: "All offline data has been synchronized",
          })
        }, 2000)
      }
    } catch (error) {
      console.error("Error syncing offline data:", error)
    }
  }

  const initializeMap = () => {
    if (!mapRef.current) {
      console.error("Map container not found")
      return
    }

    try {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: austinCenter,
        zoom: 12,
        mapTypeId: "roadmap",
        gestureHandling: "greedy", // Prevents page zoom on mobile
        styles: [
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#e3f2fd" }],
          },
          {
            featureType: "landscape",
            elementType: "geometry",
            stylers: [{ color: "#f8f9ff" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }],
          },
          {
            featureType: "poi",
            elementType: "geometry",
            stylers: [{ color: "#f3e5f5" }],
          },
        ],
      })

      setMap(mapInstance)

      // Add click listener to map with error handling
      mapInstance.addListener("click", (event: any) => {
        if (event?.latLng) {
          handleMapClick(event.latLng, mapInstance).catch((error) => {
            console.error("Map click handler error:", error)
          })
        }
      })

      console.log("Map initialized successfully")
    } catch (error) {
      console.error("Failed to initialize map:", error)
      setMapError("Failed to initialize Google Maps. Please refresh the page and try again.")
    }
  }

  const getMarkerColor = (status: Pin["status"]) => {
    switch (status) {
      case "not-interested":
        return "#ef4444" // Red
      case "not-home":
        return "#eab308" // Yellow
      case "follow-up":
        return "#3b82f6" // Blue
      case "onboarded":
        return "#22c55e" // Green
      default:
        return "#6b7280" // Gray for new pins
    }
  }

  const createMarker = (pin: Pin, mapInstance: any) => {
    const marker = new window.google.maps.Marker({
      position: { lat: pin.lat, lng: pin.lng },
      map: mapInstance,
      title: pin.address,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: getMarkerColor(pin.status),
        fillOpacity: 1,
        strokeColor: pin.offline ? "#ff6b6b" : "#ffffff",
        strokeWeight: pin.offline ? 3 : 2,
      },
    })

    // Add click listener to marker
    marker.addListener("click", () => {
      console.log("Marker clicked, opening modal")
      setSelectedPin(pin)
      loadStreetView(pin.lat, pin.lng)
    })

    return marker
  }

  const updateMarkerColor = (pinId: string, status: Pin["status"]) => {
    const markerRef = markers.find((m) => m.id === pinId)
    if (markerRef) {
      const pin = pins.find((p) => p.id === pinId)
      markerRef.marker.setIcon({
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: getMarkerColor(status),
        fillOpacity: 1,
        strokeColor: pin?.offline ? "#ff6b6b" : "#ffffff",
        strokeWeight: pin?.offline ? 3 : 2,
      })
    }
  }

  const handleMapClick = async (latLng: any, mapInstance: any) => {
    console.log("Map clicked at:", latLng.lat(), latLng.lng())
    setDebugInfo("Processing click...")

    const lat = latLng.lat()
    const lng = latLng.lng()

    setIsLoading(true)

    try {
      let address = `${lat.toFixed(6)}, ${lng.toFixed(6)}` // Default fallback
      let placeId = ""
      const propertyName = ""

      if (isOnline) {
        setDebugInfo("Getting address...")

        // Use Google Geocoding API
        try {
          const geocoder = new window.google.maps.Geocoder()
          const response = await new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Geocoding timeout")), 5000)

            geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
              clearTimeout(timeout)
              if (status === "OK" && results && results[0]) {
                resolve(results[0])
              } else {
                reject(new Error(`Geocoding failed: ${status}`))
              }
            })
          })

          address = response.formatted_address || address
          placeId = response.place_id || ""
          console.log("Geocoding successful:", address)
        } catch (geocodingError) {
          console.warn("Geocoding failed, using coordinates:", geocodingError)
        }
      } else {
        setDebugInfo("Offline - using coordinates...")
      }

      // Check if address already has a pin
      if (usedAddresses.has(address)) {
        alert("This address already has a pin!")
        return
      }

      setDebugInfo("Creating pin...")

      // Create new pin
      const newPin: Pin = {
        id: Date.now().toString(),
        lat,
        lng,
        address,
        placeId,
        propertyName,
        status: "new",
        timestamp: new Date(),
        offline: !isOnline,
      }

      console.log("Created pin:", newPin)

      // Save to offline storage
      await offlineStorage.savePin(newPin)

      // Add marker to map
      if (map) {
        try {
          const marker = createMarker(newPin, map)

          // Store marker reference
          setMarkers((prev) => [...prev, { id: newPin.id, marker }])

          console.log("Marker added successfully")
        } catch (markerError) {
          console.error("Failed to create marker:", markerError)
        }
      }

      // Update state
      setPins((prev) => [...prev, newPin])
      setUsedAddresses((prev) => new Set([...prev, address]))

      // Open modal immediately
      console.log("Opening modal for new pin")
      setSelectedPin(newPin)
      loadStreetView(lat, lng)

      setDebugInfo(isOnline ? "Pin created successfully!" : "Pin saved offline!")
    } catch (error) {
      console.error("Error in handleMapClick:", error)
      setDebugInfo(`Error: ${error.message}`)

      // Create a basic pin even if APIs fail
      const fallbackPin: Pin = {
        id: Date.now().toString(),
        lat,
        lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        status: "new",
        timestamp: new Date(),
        offline: !isOnline,
      }

      await offlineStorage.savePin(fallbackPin)
      setPins((prev) => [...prev, fallbackPin])
      setSelectedPin(fallbackPin)
      loadStreetView(lat, lng)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStreetView = async (lat: number, lng: number) => {
    if (!isOnline) {
      setStreetViewUrl("/placeholder.svg?height=300&width=600")
      return
    }

    try {
      let heading = 0

      // Try to get optimal heading using Street View Service
      if (window.google && window.google.maps) {
        try {
          const streetViewService = new window.google.maps.StreetViewService()

          const streetViewData = await new Promise<any>((resolve, reject) => {
            streetViewService.getPanorama(
              {
                location: { lat, lng },
                radius: 50,
                source: window.google.maps.StreetViewSource.OUTDOOR,
              },
              (data: any, status: any) => {
                if (status === "OK" && data) {
                  resolve(data)
                } else {
                  reject(new Error(`Street View not available: ${status}`))
                }
              },
            )
          })

          // Calculate heading to face the clicked location from the street view position
          if (streetViewData && streetViewData.location) {
            const streetViewPos = streetViewData.location.latLng
            heading = window.google.maps.geometry.spherical.computeHeading(streetViewPos, { lat, lng })
          }
        } catch (error) {
          console.warn("Street View Service failed, using default heading:", error)
        }
      }

      // Generate Street View URL using server action
      const url = await generateStreetViewUrl(lat, lng, heading)
      setStreetViewUrl(url)
      console.log("Street View URL generated")
    } catch (error) {
      console.error("Failed to load street view:", error)
      setStreetViewUrl("/placeholder.svg?height=300&width=600")
    }
  }

  const updatePinStatus = async (pinId: string, status: Pin["status"]) => {
    const updatedPins = pins.map((pin) => (pin.id === pinId ? { ...pin, status, offline: !isOnline } : pin))
    setPins(updatedPins)

    // Save to offline storage
    const updatedPin = updatedPins.find((p) => p.id === pinId)
    if (updatedPin) {
      await offlineStorage.savePin(updatedPin)
    }

    // Update marker color
    updateMarkerColor(pinId, status)

    setSelectedPin(null)
  }

  const handleFollowUpClick = () => {
    setShowFollowUpModal(true)
  }

  const handleFollowUpSave = async (data: FollowUpData) => {
    const followUpData = { ...data, offline: !isOnline }

    // Add follow-up to the list
    setFollowUps((prev) => [...prev, followUpData])

    // Save to offline storage
    await offlineStorage.saveFollowUp(followUpData)

    // Update pin status to follow-up
    if (selectedPin) {
      updatePinStatus(selectedPin.id, "follow-up")
    }

    // Close modal
    setShowFollowUpModal(false)
  }

  const handleFollowUpCancel = () => {
    setShowFollowUpModal(false)
  }

  const handleOnboardClick = () => {
    setShowOnboardForm(true)
  }

  const handleOnboardSubmit = async (data: OnboardData) => {
    const customerData = { ...data, offline: !isOnline }

    // Update pin status to onboarded
    if (selectedPin) {
      updatePinStatus(selectedPin.id, "onboarded")
    }

    // Store onboard data
    setOnboardedCustomers((prev) => [...prev, customerData])
    setCurrentOnboardData(customerData)

    // Save to offline storage
    await offlineStorage.saveCustomer(customerData)

    // Close onboard form and show success modal
    setShowOnboardForm(false)
    setShowSuccessModal(true)

    // Show success toast
    toast({
      title: "Success!",
      description: `${data.firstName} has been successfully onboarded${!isOnline ? " (saved offline)" : ""}!`,
    })
  }

  const handleOnboardCancel = () => {
    setShowOnboardForm(false)
  }

  const handleSuccessBackToMap = () => {
    setShowSuccessModal(false)
    setSelectedPin(null)
    setCurrentOnboardData(null)
  }

  const handleSuccessViewProfile = () => {
    setShowSuccessModal(false)
    setSelectedPin(null)
    // Here you would navigate to profile view
    alert(`Viewing profile for ${currentOnboardData?.firstName}`)
    setCurrentOnboardData(null)
  }

  const handleGpsClick = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.")
      return
    }

    setIsGpsLoading(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const newLocation = { lat: latitude, lng: longitude }

        setUserLocation(newLocation)

        if (map) {
          // Center map on user location
          map.setCenter(newLocation)
          map.setZoom(16)

          // Add or update user location marker
          const userMarker = new window.google.maps.Marker({
            position: newLocation,
            map: map,
            title: "Your Location",
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#8b5cf6",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            },
          })

          console.log("GPS location found:", newLocation)
        }

        setIsGpsLoading(false)
      },
      (error) => {
        console.error("GPS error:", error)
        let errorMessage = "Unable to get your location. "

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Location access was denied. Please enable location permissions."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable."
            break
          case error.TIMEOUT:
            errorMessage += "Location request timed out."
            break
          default:
            errorMessage += "An unknown error occurred."
            break
        }

        alert(errorMessage)
        setIsGpsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  const getStatusIcon = (status: Pin["status"]) => {
    switch (status) {
      case "not-home":
        return <Home className="h-4 w-4" />
      case "not-interested":
        return <UserX className="h-4 w-4" />
      case "follow-up":
        return <Clock className="h-4 w-4" />
      case "onboarded":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: Pin["status"]) => {
    switch (status) {
      case "not-home":
        return "bg-yellow-500"
      case "not-interested":
        return "bg-red-500"
      case "follow-up":
        return "bg-blue-500"
      case "onboarded":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 overflow-hidden touch-pan-y">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-purple-100 p-3 sm:p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent truncate flex-1 min-w-0">
              PulseChain Education Tracker
            </h1>
            {/* Online/Offline Indicator */}
            <div className="flex items-center gap-1">
              {isOnline ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
              <span className="text-xs text-gray-600 hidden sm:inline">{isOnline ? "Online" : "Offline"}</span>
            </div>
          </div>

          {/* Desktop Header Controls */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCalendarView(true)}
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Calendar className="h-4 w-4 mr-2" />
              View Calendar
            </Button>
            <Badge variant="outline" className="flex items-center gap-1 border-purple-200 text-purple-700">
              <MapPin className="h-3 w-3" />
              {pins.length} Doors Knocked
            </Badge>
            {debugInfo && (
              <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 max-w-32 truncate">
                {debugInfo}
              </Badge>
            )}
          </div>

          {/* Mobile Header Controls */}
          <div className="flex md:hidden items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1 border-purple-200 text-purple-700 text-xs">
              <MapPin className="h-3 w-3" />
              {pins.length}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="md:hidden mt-3 p-3 bg-white/90 backdrop-blur-sm rounded-lg border border-purple-200 shadow-lg">
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCalendarView(true)
                  setShowMobileMenu(false)
                }}
                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <Calendar className="h-4 w-4 mr-2" />
                View Calendar
              </Button>
              {debugInfo && (
                <Badge
                  variant="outline"
                  className="w-full text-xs border-blue-200 text-blue-700 justify-center truncate"
                >
                  {debugInfo}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="flex-1 relative min-h-0 touch-none">
        {mapError ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-100 to-pink-100 p-4">
            <Card className="max-w-md w-full border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-red-600 text-lg flex items-center gap-2">
                  {!isOnline && <WifiOff className="h-5 w-5" />}
                  {isOnline ? "Google Maps Error" : "Offline Mode"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 text-sm">{mapError}</p>
                {!isOnline ? (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h4 className="font-semibold mb-2 text-sm">Available offline features:</h4>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>View cached locations and data</li>
                      <li>Add new pins (will sync when online)</li>
                      <li>Schedule follow-ups</li>
                      <li>Onboard customers</li>
                      <li>View calendar</li>
                    </ul>
                  </div>
                ) : (
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <h4 className="font-semibold mb-2 text-sm">To fix this issue:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>
                        Go to{" "}
                        <a
                          href="https://console.cloud.google.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:underline"
                        >
                          Google Cloud Console
                        </a>
                      </li>
                      <li>Create a new project or select an existing one</li>
                      <li>
                        Enable the following APIs:
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Maps JavaScript API</li>
                          <li>Geocoding API</li>
                          <li>Street View Static API</li>
                        </ul>
                      </li>
                      <li>Create an API key in "Credentials"</li>
                      <li>Add the API key to your environment variables</li>
                      <li>Restart your development server</li>
                    </ol>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div ref={mapRef} className="w-full h-full touch-none" />
        )}

        {/* GPS Button */}
        {!mapError && (
          <Button
            onClick={handleGpsClick}
            disabled={isGpsLoading}
            className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm text-purple-700 border border-purple-200 hover:bg-purple-50 shadow-lg"
            size="sm"
          >
            {isGpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
            <span className="hidden sm:inline ml-2">{isGpsLoading ? "Getting Location..." : "My Location"}</span>
          </Button>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg border border-purple-200 shadow-lg max-w-xs w-full text-center">
              <p className="text-purple-700 text-sm">
                {isOnline ? "Loading address information..." : "Saving location offline..."}
              </p>
            </div>
          </div>
        )}

        {/* Pin Details Modal */}
        {selectedPin && !showOnboardForm && !showFollowUpModal && !showSuccessModal && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedPin(null)
              }
            }}
          >
            <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-purple-200 shadow-xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700 text-lg">
                  {getStatusIcon(selectedPin.status)}
                  Location Details
                  {selectedPin.offline && (
                    <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                      Offline
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Address and Property Info */}
                <div>
                  {selectedPin.propertyName && (
                    <>
                      <p className="text-sm text-gray-600">Property:</p>
                      <p className="font-semibold text-base break-words">{selectedPin.propertyName}</p>
                    </>
                  )}
                  <p className="text-sm text-gray-600 mt-2">Address:</p>
                  <p className="font-medium text-sm break-words">{selectedPin.address}</p>
                  <p className="text-xs text-gray-500 mt-1 break-all">
                    {selectedPin.lat.toFixed(6)}, {selectedPin.lng.toFixed(6)}
                  </p>
                </div>

                {/* Street View Image */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Street View:</p>
                  <img
                    src={streetViewUrl || "/placeholder.svg?height=300&width=600"}
                    alt="Street view"
                    className="w-full h-40 sm:h-48 object-cover rounded-lg border border-purple-200 shadow-sm"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?height=300&width=600"
                    }}
                  />
                  {!isOnline && <p className="text-xs text-orange-600 mt-1">Street View unavailable offline</p>}
                </div>

                {/* Status Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePinStatus(selectedPin.id, "not-home")}
                    className="flex items-center gap-1 border-yellow-300 text-yellow-700 hover:bg-yellow-50 text-xs"
                  >
                    <Home className="h-3 w-3" />
                    Not Home
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePinStatus(selectedPin.id, "not-interested")}
                    className="flex items-center gap-1 border-red-300 text-red-700 hover:bg-red-50 text-xs"
                  >
                    <UserX className="h-3 w-3" />
                    Not Interested
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFollowUpClick}
                    className="flex items-center gap-1 border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent text-xs"
                  >
                    <Clock className="h-3 w-3" />
                    Follow-up
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOnboardClick}
                    className="flex items-center gap-1 border-green-300 text-green-700 hover:bg-green-50 bg-transparent text-xs"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Onboarded
                  </Button>
                </div>

                {/* Create New Onboard Button */}
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-sm"
                  onClick={handleOnboardClick}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Onboard
                </Button>

                {/* Close Button */}
                <Button
                  variant="outline"
                  className="w-full bg-transparent border-purple-200 text-purple-700 hover:bg-purple-50 text-sm"
                  onClick={() => {
                    console.log("Closing modal")
                    setSelectedPin(null)
                  }}
                >
                  Close
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Follow-up Modal */}
        {showFollowUpModal && selectedPin && (
          <FollowUpModal pin={selectedPin} onSave={handleFollowUpSave} onCancel={handleFollowUpCancel} />
        )}

        {/* Calendar View */}
        {showCalendarView && <CalendarView followUps={followUps} onClose={() => setShowCalendarView(false)} />}

        {/* Onboarding Form */}
        {showOnboardForm && selectedPin && (
          <OnboardingForm pin={selectedPin} onSubmit={handleOnboardSubmit} onCancel={handleOnboardCancel} />
        )}

        {/* Success Modal */}
        {showSuccessModal && currentOnboardData && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-purple-200 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600 text-lg">
                  <CheckCircle className="h-6 w-6" />
                  Onboarding Complete!
                  {currentOnboardData.offline && (
                    <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                      Saved Offline
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-lg font-semibold break-words">{currentOnboardData.firstName}</p>
                  <p className="text-sm text-gray-600">has been successfully onboarded</p>
                  <p className="text-xs text-gray-500 mt-1 break-words">{currentOnboardData.address}</p>
                  {currentOnboardData.offline && (
                    <p className="text-xs text-orange-600 mt-1">Data will sync when online</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent border-purple-200 text-purple-700 hover:bg-purple-50 text-sm"
                    onClick={handleSuccessBackToMap}
                  >
                    Back To Map
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-sm"
                    onClick={handleSuccessViewProfile}
                  >
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Stats Bar - Fixed height and proper mobile spacing */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-purple-100 p-3 sm:p-4 flex-shrink-0 min-h-[80px] sm:min-h-[60px]">
        <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-around gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
            <span className="truncate">Not Home: {pins.filter((p) => p.status === "not-home").length}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full flex-shrink-0"></div>
            <span className="truncate">Not Interested: {pins.filter((p) => p.status === "not-interested").length}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
            <span className="truncate">Follow-up: {pins.filter((p) => p.status === "follow-up").length}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full flex-shrink-0"></div>
            <span className="truncate">Onboarded: {pins.filter((p) => p.status === "onboarded").length}</span>
          </div>
        </div>

        {/* Offline indicator in stats */}
        {!isOnline && (
          <div className="mt-2 text-center">
            <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
              <WifiOff className="h-3 w-3 mr-1" />
              Working Offline - Data will sync when connected
            </Badge>
          </div>
        )}
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}
