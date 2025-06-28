"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import type { FollowUpData } from "@/components/follow-up-modal"

// Utils and storage
import { offlineStorage } from "@/lib/offline-storage"
import type { Territory } from "@/lib/territory-storage"

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
  const [searchAddress, setSearchAddress] = useState('')
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapCenter, setMapCenter] = useState(defaultCenter)
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false)
  const [streetViewUrl, setStreetViewUrl] = useState('')
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false)
  const [showSetupGuide, setShowSetupGuide] = useState(false)
  const [isApiKeyValid, setIsApiKeyValid] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('map')

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
            lng: position.coords.longitude
          }
          setCurrentLocation(location)
          setMapCenter(location)
        },
        (error) => {
          console.warn('Geolocation error:', error)
          toast({
            title: "Location Access",
            description: "Unable to get your current location. Using default location.",
            variant: "destructive"
          })
        }
      )
    }
  }, [toast])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      
      // Check if onboarding is complete
      const onboardingStatus = await offlineStorage.getSetting('onboarding-complete')
      setIsOnboardingComplete(!!onboardingStatus)
      
      // Check API key validity
      const apiKeyStatus = await offlineStorage.getSetting('api-key-valid')
      setIsApiKeyValid(!!apiKeyStatus)
      
      // Load pins and follow-ups
      const [loadedPins, loadedFollowUps] = await Promise.all([
        offlineStorage.getPins(),
        offlineStorage.getFollowUps()
      ])
      
      setPins(loadedPins.map(pin => ({
        ...pin,
        timestamp: new Date(pin.timestamp)
      })))
      
      setFollowUps(loadedFollowUps.map(followUp => ({
        ...followUp,
        date: new Date(followUp.date),
        createdAt: new Date(followUp.createdAt)
      })))
      
    } catch (error) {
      console.error('Error loading initial data:', error)
      toast({
        title: "Error",
        description: "Failed to load saved data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMapClick = useCallback(async (event: google.maps.MapMouseEvent) => {
    if (!event.\
