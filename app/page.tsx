"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
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
  Square,
} from "lucide-react"
import { OnboardingForm } from "@/components/onboarding-form"
import { FollowUpModal } from "@/components/follow-up-modal"
import { CalendarView } from "@/components/calendar-view"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { getGoogleMapsConfig, generateStreetViewUrl } from "@/lib/maps-server"
import { offlineStorage } from "@/lib/offline-storage"
import { usePWA } from "@/hooks/use-pwa"
import { toast } from "@/hooks/use-toast"
import { TerritoryManager } from "@/components/territory-manager"
import { TerritoryForm } from "@/components/territory-form"
import { territoryStorage, type Territory } from "@/lib/territory-storage"
import { followUpStorage } from "@/lib/follow-up-storage"
import { pinStorage } from "@/lib/pin-storage"
import { customerStorage } from "@/lib/customer-storage"
import { getTerritoriesContainingPoint } from "@/lib/turf-utils"
import type { Pin as BasePin } from "@/lib/types"

// Extend the base Pin interface for local use with offline functionality
interface Pin extends BasePin {
  status: "not-home" | "not-interested" | "follow-up" | "onboarded" | "new"
  timestamp?: Date // For backward compatibility
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
  const searchParams = useSearchParams()
  const router = useRouter()
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
  const [isModalTransitioning, setIsModalTransitioning] = useState(false)
  const [currentOnboardData, setCurrentOnboardData] = useState<OnboardData | null>(null)
  const [onboardedCustomers, setOnboardedCustomers] = useState<OnboardData[]>([])
  const [followUps, setFollowUps] = useState<FollowUpData[]>([])
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const [territories, setTerritories] = useState<Territory[]>([])
  const [territoryPolygons, setTerritoryPolygons] = useState<any[]>([])
  const [visibleTerritories, setVisibleTerritories] = useState<Set<string>>(new Set())
  const [showTerritoryManager, setShowTerritoryManager] = useState(false)
  const [showTerritoryForm, setShowTerritoryForm] = useState(false)
  const [pendingTerritoryCoords, setPendingTerritoryCoords] = useState<Array<{ lat: number; lng: number }>>([])
  const [drawingManager, setDrawingManager] = useState<any>(null)
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [mapsLoaded, setMapsLoaded] = useState(false)

  const { isOnline } = usePWA()

  // Austin, Texas coordinates
  const austinCenter = { lat: 30.2672, lng: -97.7431 }

  // Check URL parameters to open calendar or territory views (mutually exclusive)
  useEffect(() => {
    const view = searchParams.get('view')
    if (view === 'calendar') {
      setIsModalTransitioning(true)
      setTimeout(() => {
        setShowCalendarView(true)
        setShowTerritoryManager(false) // Close territory if open
        setIsModalTransitioning(false)
      }, 100)
    } else if (view === 'territories') {
      setIsModalTransitioning(true)
      setTimeout(() => {
        setShowTerritoryManager(true)
        setShowCalendarView(false) // Close calendar if open
        setIsModalTransitioning(false)
      }, 100)
    } else {
      // No view parameter, close both views
      setShowCalendarView(false)
      setShowTerritoryManager(false)
    }
  }, [searchParams])

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

        // Load cached territories
        const cachedTerritories = await territoryStorage.getTerritories()
        if (cachedTerritories.length > 0) {
          setTerritories(cachedTerritories)
          setVisibleTerritories(new Set(cachedTerritories.map((t) => t.id)))
        }

        console.log("Loaded cached data:", {
          pins: cachedPins.length,
          followUps: cachedFollowUps.length,
          customers: cachedCustomers.length,
          territories: cachedTerritories.length,
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

        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
          console.log("Google Maps already loaded")
          setMapsLoaded(true)
          initializeMap()
          return
        }

        // Load Google Maps script with error handling
        const script = document.createElement("script")
        script.src = config.scriptUrl
        script.async = true
        script.defer = true

        // Handle script loading errors
        script.onerror = (error) => {
          console.error("Google Maps script loading error:", error)
          setMapError("Failed to load Google Maps. Please check your internet connection and API key.")
        }

        script.onload = () => {
          console.log("Google Maps script loaded successfully")
          setMapsLoaded(true)
        }

        window.initMap = () => {
          try {
            console.log("Initializing Google Maps...")
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

    if (!window.google || !window.google.maps) {
      console.error("Google Maps not loaded")
      setMapError("Google Maps failed to load. Please refresh the page.")
      return
    }

    try {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: austinCenter,
        zoom: 12,
        mapTypeId: "satellite",
        gestureHandling: "greedy", // Prevents page zoom on mobile
        mapTypeControl: false, // Disable map type control
        fullscreenControl: false, // Disable fullscreen control
        streetViewControl: false, // Disable street view control
        zoomControl: true, // Keep zoom controls
        rotateControl: true, // Enable native rotation control buttons
        rotateControlOptions: {
          position: window.google.maps.ControlPosition.TOP_LEFT,
        },
        tilt: 0, // Disable auto-tilt
        minZoom: 3, // Minimum zoom level
        maxZoom: 22, // Maximum zoom level to prevent excessive zooming
        restriction: {
          strictBounds: false,
        },
        styles: [
          {
            featureType: "all",
            elementType: "labels",
            stylers: [{ visibility: "off" }], // Hide all labels
          },
        ],
      })

      setMap(mapInstance)

      // Initialize Drawing Manager only if drawing library is available
      if (window.google.maps.drawing) {
        try {
          const drawingManagerInstance = new window.google.maps.drawing.DrawingManager({
            drawingMode: null,
            drawingControl: true,
            drawingControlOptions: {
              position: window.google.maps.ControlPosition.TOP_CENTER,
              drawingModes: [window.google.maps.drawing.OverlayType.POLYGON],
            },
            polygonOptions: {
              editable: true,
              fillColor: "#3b82f6",
              fillOpacity: 0.3,
              strokeColor: "#3b82f6",
              strokeWeight: 2,
            },
          })

          drawingManagerInstance.setMap(mapInstance)
          setDrawingManager(drawingManagerInstance)

          // Handle polygon completion
          drawingManagerInstance.addListener("polygoncomplete", (polygon: any) => {
            try {
              const coordinates = polygon
                .getPath()
                .getArray()
                .map((coord: any) => ({
                  lat: coord.lat(),
                  lng: coord.lng(),
                }))

              setPendingTerritoryCoords(coordinates)
              setShowTerritoryForm(true)
              setIsDrawingMode(false)
              drawingManagerInstance.setDrawingMode(null)

              // Remove the temporary polygon
              polygon.setMap(null)
            } catch (error) {
              console.error("Error handling polygon completion:", error)
              toast({
                title: "Error",
                description: "Failed to create territory. Please try again.",
                variant: "destructive",
              })
            }
          })

          // Handle drawing mode changes
          drawingManagerInstance.addListener("drawingmode_changed", () => {
            try {
              const mode = drawingManagerInstance.getDrawingMode()
              setIsDrawingMode(mode === window.google.maps.drawing.OverlayType.POLYGON)
            } catch (error) {
              console.error("Error handling drawing mode change:", error)
            }
          })

          console.log("Drawing Manager initialized successfully")
        } catch (error) {
          console.error("Error initializing Drawing Manager:", error)
          toast({
            title: "Warning",
            description: "Territory drawing tools are not available. Basic map functionality will work.",
          })
        }
      } else {
        console.warn("Google Maps Drawing library not available")
        toast({
          title: "Warning",
          description: "Territory drawing tools are not available. Please check your API configuration.",
        })
      }

      // Add click listener to map with error handling
      mapInstance.addListener("click", (event: any) => {
        if (event?.latLng && !isDrawingMode) {
          handleMapClick(event.latLng, mapInstance).catch((error) => {
            console.error("Map click handler error:", error)
          })
        }
      })

      // Ensure tilt stays at 0 to prevent auto-tilt on zoom
      mapInstance.addListener("zoom_changed", () => {
        if (mapInstance.getTilt && mapInstance.getTilt() !== 0) {
          mapInstance.setTilt(0)
        }
      })

      // Also listen for tilt changes and reset them
      mapInstance.addListener("tilt_changed", () => {
        if (mapInstance.getTilt && mapInstance.getTilt() !== 0) {
          mapInstance.setTilt(0)
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
    if (!window.google || !window.google.maps) {
      throw new Error("Google Maps not available")
    }

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
    if (markerRef && window.google && window.google.maps) {
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

      if (isOnline && window.google && window.google.maps) {
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
        toast({
          title: "Duplicate Location",
          description: "This address already has a pin!",
          variant: "destructive",
        })
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
        createdAt: new Date(),
        updatedAt: new Date(),
        timestamp: new Date(), // For backward compatibility
        offline: !isOnline,
      }

      console.log("Created pin:", newPin)

      // Save to PostgreSQL database and offline storage
      try {
        await pinStorage.createPin({
          id: newPin.id,
          lat: newPin.lat,
          lng: newPin.lng,
          address: newPin.address,
          placeId: newPin.placeId,
          propertyName: newPin.propertyName,
          status: newPin.status,
        })
        console.log("Pin saved to database")
      } catch (dbError) {
        console.error("Failed to save pin to database:", dbError)
        // Continue with offline storage as fallback
      }

      // Save to offline storage as well
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

      // Check if pin is in any territories
      try {
        const containingTerritories = checkPinTerritories(newPin)
        if (containingTerritories.length > 0) {
          toast({
            title: "Pin in Territory",
            description: `This location is in: ${containingTerritories.map((t) => t.name).join(", ")}`,
          })
        }
      } catch (error) {
        console.error("Error checking territories:", error)
      }

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
        createdAt: new Date(),
        updatedAt: new Date(),
        timestamp: new Date(), // For backward compatibility
        offline: !isOnline,
      }

      try {
        // Try to save to database first
        try {
          await pinStorage.createPin({
            id: fallbackPin.id,
            lat: fallbackPin.lat,
            lng: fallbackPin.lng,
            address: fallbackPin.address,
            status: fallbackPin.status,
          })
          console.log("Fallback pin saved to database")
        } catch (dbError) {
          console.error("Failed to save fallback pin to database:", dbError)
        }

        // Save to offline storage as well
        await offlineStorage.savePin(fallbackPin)
        setPins((prev) => [...prev, fallbackPin])
        setSelectedPin(fallbackPin)
        loadStreetView(lat, lng)
      } catch (storageError) {
        console.error("Error saving fallback pin:", storageError)
        toast({
          title: "Error",
          description: "Failed to save location. Please try again.",
          variant: "destructive",
        })
      }
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
            const timeout = setTimeout(() => reject(new Error("Street View timeout")), 5000)

            streetViewService.getPanorama(
              {
                location: { lat, lng },
                radius: 50,
                source: window.google.maps.StreetViewSource.OUTDOOR,
              },
              (data: any, status: any) => {
                clearTimeout(timeout)
                if (status === "OK" && data) {
                  resolve(data)
                } else {
                  reject(new Error(`Street View not available: ${status}`))
                }
              },
            )
          })

          // Calculate heading to face the clicked location from the street view position
          if (streetViewData && streetViewData.location && window.google.maps.geometry) {
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
    const updatedPins = pins.map((pin) => 
      pin.id === pinId 
        ? { ...pin, status, updatedAt: new Date(), offline: !isOnline } 
        : pin
    )
    setPins(updatedPins)

    // Update in database
    try {
      await pinStorage.updatePinStatus(pinId, status)
      console.log("Pin status updated in database")
    } catch (dbError) {
      console.error("Failed to update pin status in database:", dbError)
    }

    // Save to offline storage as well
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
    try {
      // Save to PostgreSQL database via server actions
      const savedFollowUp = await followUpStorage.saveFollowUp(data)

      // Add follow-up to the local list (for immediate UI feedback)
      setFollowUps((prev) => [...prev, data])

      // Update pin status to follow-up
      if (selectedPin) {
        updatePinStatus(selectedPin.id, "follow-up")
      }

      // Close modal
      setShowFollowUpModal(false)

      // Show success toast
      toast({
        title: "Follow-up Scheduled!",
        description: `Appointment saved to database for ${new Date(data.date).toLocaleDateString()} at ${data.time}`,
      })

      console.log("Follow-up saved to database:", savedFollowUp)
    } catch (error) {
      console.error("Error saving follow-up:", error)
      
      // Fallback to offline storage if database save fails
      if (!isOnline) {
        const followUpData = { ...data, offline: true }
        await offlineStorage.saveFollowUp(followUpData)
        setFollowUps((prev) => [...prev, followUpData])
        
        if (selectedPin) {
          updatePinStatus(selectedPin.id, "follow-up")
        }
        setShowFollowUpModal(false)
        
        toast({
          title: "Follow-up Scheduled Offline",
          description: "Your follow-up has been saved locally and will sync when online.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to save follow-up. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleFollowUpCancel = () => {
    setShowFollowUpModal(false)
  }

  const handleOnboardClick = () => {
    setShowOnboardForm(true)
  }

  const handleOnboardSubmit = async (data: OnboardData) => {
    try {
      // Save to PostgreSQL database via server actions
      const savedCustomer = await customerStorage.saveOnboardData({
        firstName: data.firstName,
        phone: data.phone,
        email: data.email,
        ownsCrypto: data.ownsCrypto,
        socials: data.socials,
        notes: data.notes,
        pinId: data.pinId,
        address: data.address,
        timestamp: data.timestamp,
      })

      // Update pin status to onboarded
      if (selectedPin) {
        updatePinStatus(selectedPin.id, "onboarded")
      }

      // Store onboard data locally (for immediate UI feedback)
      const customerData = { ...data, offline: false }
      setOnboardedCustomers((prev) => [...prev, customerData])
      setCurrentOnboardData(customerData)

      // Close onboard form and show success modal
      setShowOnboardForm(false)
      setShowSuccessModal(true)

      // Show success toast
      toast({
        title: "Success!",
        description: `${data.firstName} has been successfully onboarded and saved to database!`,
      })

      console.log("Customer saved to database:", savedCustomer)
    } catch (error) {
      console.error("Error saving customer:", error)
      
      // Fallback to offline storage if database save fails
      if (!isOnline) {
        const customerData = { ...data, offline: true }
        await offlineStorage.saveCustomer(customerData)
        setOnboardedCustomers((prev) => [...prev, customerData])
        setCurrentOnboardData(customerData)
        
        if (selectedPin) {
          updatePinStatus(selectedPin.id, "onboarded")
        }
        setShowOnboardForm(false)
        setShowSuccessModal(true)
        
        toast({
          title: "Customer Onboarded Offline",
          description: "Customer has been saved locally and will sync when online.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to onboard customer. Please try again.",
          variant: "destructive",
        })
      }
    }
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
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      })
      return
    }

    setIsGpsLoading(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const newLocation = { lat: latitude, lng: longitude }

        setUserLocation(newLocation)

        if (map && window.google && window.google.maps) {
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

        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        })
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

  const loadTerritoryPolygons = () => {
    if (!map || !window.google || !window.google.maps) return

    // Clear existing territory polygons
    territoryPolygons.forEach((polygon) => {
      try {
        polygon.setMap(null)
      } catch (error) {
        console.error("Error clearing polygon:", error)
      }
    })

    // Create new polygons for visible territories
    const newPolygons = territories
      .filter((territory) => visibleTerritories.has(territory.id))
      .map((territory) => {
        try {
          const polygon = new window.google.maps.Polygon({
            paths: territory.coordinates,
            fillColor: territory.color,
            fillOpacity: 0.2,
            strokeColor: territory.color,
            strokeWeight: 2,
            map: map,
          })

          // Add territory info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div class="p-2"><strong>${territory.name}</strong><br/><small>${territory.coordinates.length} points</small></div>`,
          })

          polygon.addListener("click", (event: any) => {
            try {
              infoWindow.setPosition(event.latLng)
              infoWindow.open(map)
            } catch (error) {
              console.error("Error opening info window:", error)
            }
          })

          return polygon
        } catch (error) {
          console.error("Error creating territory polygon:", error)
          return null
        }
      })
      .filter(Boolean) // Remove null values

    setTerritoryPolygons(newPolygons)
  }

  const handleCreateTerritory = async (name: string, color: string) => {
    try {
      const newTerritory: Territory = {
        id: Date.now().toString(),
        name,
        color,
        coordinates: pendingTerritoryCoords,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await territoryStorage.saveTerritory(newTerritory)
      setTerritories((prev) => [...prev, newTerritory])
      setVisibleTerritories((prev) => new Set([...prev, newTerritory.id]))
      setShowTerritoryForm(false)
      setPendingTerritoryCoords([])

      toast({
        title: "Territory Created!",
        description: `"${name}" has been created successfully.`,
      })
    } catch (error) {
      console.error("Error creating territory:", error)
      toast({
        title: "Error",
        description: "Failed to create territory. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTerritory = async (territory: Territory) => {
    try {
      await territoryStorage.updateTerritory(territory)
      setTerritories((prev) => prev.map((t) => (t.id === territory.id ? territory : t)))
    } catch (error) {
      console.error("Error updating territory:", error)
      toast({
        title: "Error",
        description: "Failed to update territory. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTerritory = async (id: string) => {
    try {
      await territoryStorage.deleteTerritory(id)
      setTerritories((prev) => prev.filter((t) => t.id !== id))
      setVisibleTerritories((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    } catch (error) {
      console.error("Error deleting territory:", error)
      toast({
        title: "Error",
        description: "Failed to delete territory. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleToggleTerritoryVisibility = (id: string) => {
    setVisibleTerritories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const checkPinTerritories = (pin: any) => {
    try {
      const containingTerritories = getTerritoriesContainingPoint({ lat: pin.lat, lng: pin.lng }, territories)
      if (containingTerritories.length > 0) {
        console.log(
          `Pin at ${pin.address} is in territories:`,
          containingTerritories.map((t) => t.name),
        )
      }
      return containingTerritories
    } catch (error) {
      console.error("Error checking pin territories:", error)
      return []
    }
  }

  // Load territory polygons when territories or visibility changes
  useEffect(() => {
    if (map && territories.length > 0 && mapsLoaded) {
      loadTerritoryPolygons()
    }
  }, [map, territories, visibleTerritories, mapsLoaded])

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


            <Badge variant="outline" className="flex items-center gap-1 border-purple-200 text-purple-700">
              <MapPin className="h-3 w-3" />
              {pins.length} Doors Knocked
            </Badge>
            {debugInfo && (
              <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 max-w-32 truncate">
                {debugInfo}
              </Badge>
            )}
            {isDrawingMode && (
              <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                Drawing Mode Active
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
                          <li>Maps Drawing API</li>
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
            <div className="relative w-full max-w-md">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
              />
              <Card className="bg-white/95 backdrop-blur-sm border-purple-200 shadow-xl max-h-[90vh] overflow-y-auto">
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
          </div>
        )}

        {/* Follow-up Modal */}
        {showFollowUpModal && selectedPin && (
          <FollowUpModal pin={selectedPin} onSave={handleFollowUpSave} onCancel={handleFollowUpCancel} />
        )}

        {/* Calendar View */}
        {showCalendarView && (
          <CalendarView 
            followUps={followUps} 
            onClose={() => {
              setShowCalendarView(false)
              // Clear the view parameter from URL
              const params = new URLSearchParams(searchParams)
              params.delete('view')
              const newUrl = params.toString() ? `/?${params.toString()}` : '/'
              router.replace(newUrl)
            }} 
          />
        )}

        {/* Onboarding Form */}
        {showOnboardForm && selectedPin && (
          <OnboardingForm pin={selectedPin} onSubmit={handleOnboardSubmit} onCancel={handleOnboardCancel} />
        )}

        {/* Success Modal */}
        {showSuccessModal && currentOnboardData && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="relative w-full max-w-md">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
              />
              <Card className="bg-white/95 backdrop-blur-sm border-purple-200 shadow-xl">
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
          </div>
        )}
      </div>



      {/* Territory Manager */}
      {showTerritoryManager && (
        <TerritoryManager
          territories={territories}
          onClose={() => {
            setShowTerritoryManager(false)
            // Clear the view parameter from URL
            const params = new URLSearchParams(searchParams)
            params.delete('view')
            const newUrl = params.toString() ? `/?${params.toString()}` : '/'
            router.replace(newUrl)
          }}
          onUpdateTerritory={handleUpdateTerritory}
          onDeleteTerritory={handleDeleteTerritory}
          onToggleTerritoryVisibility={handleToggleTerritoryVisibility}
          visibleTerritories={visibleTerritories}
        />
      )}

      {/* Territory Form */}
      {showTerritoryForm && (
        <TerritoryForm
          coordinates={pendingTerritoryCoords}
          onSave={handleCreateTerritory}
          onCancel={() => {
            setShowTerritoryForm(false)
            setPendingTerritoryCoords([])
          }}
        />
      )}

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}
