"use server"

interface GeocodeResult {
  address: string
  lat: number
  lng: number
  placeId?: string
  propertyName?: string
}

interface StreetViewResult {
  url: string
  isAvailable: boolean
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error("Google Maps API key not configured")
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`,
      { next: { revalidate: 3600 } }, // Cache for 1 hour
    )

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status === "OK" && data.results.length > 0) {
      const result = data.results[0]
      const location = result.geometry.location

      return {
        address: result.formatted_address,
        lat: location.lat,
        lng: location.lng,
        placeId: result.place_id,
        propertyName: extractPropertyName(result),
      }
    }

    return null
  } catch (error) {
    console.error("Geocoding error:", error)
    throw new Error("Failed to geocode address")
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error("Google Maps API key not configured")
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`,
      { next: { revalidate: 3600 } },
    )

    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status === "OK" && data.results.length > 0) {
      const result = data.results[0]

      return {
        address: result.formatted_address,
        lat,
        lng,
        placeId: result.place_id,
        propertyName: extractPropertyName(result),
      }
    }

    return null
  } catch (error) {
    console.error("Reverse geocoding error:", error)
    throw new Error("Failed to reverse geocode coordinates")
  }
}

export async function getStreetViewImage(lat: number, lng: number, size = "600x400"): Promise<StreetViewResult> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error("Google Maps API key not configured")
  }

  const url = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lng}&key=${apiKey}&fov=90&heading=0&pitch=0`

  try {
    // Check if Street View is available at this location
    const metadataResponse = await fetch(
      `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${apiKey}`,
      { next: { revalidate: 86400 } }, // Cache for 24 hours
    )

    if (!metadataResponse.ok) {
      return { url: "", isAvailable: false }
    }

    const metadata = await metadataResponse.json()
    const isAvailable = metadata.status === "OK"

    return {
      url: isAvailable ? url : "",
      isAvailable,
    }
  } catch (error) {
    console.error("Street View error:", error)
    return { url: "", isAvailable: false }
  }
}

export async function validateApiKey(): Promise<{ isValid: boolean; error?: string }> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return { isValid: false, error: "API key not configured" }
  }

  try {
    // Test with a simple geocoding request
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${apiKey}`,
    )

    if (!response.ok) {
      return { isValid: false, error: `HTTP error: ${response.status}` }
    }

    const data = await response.json()

    if (data.status === "OK") {
      return { isValid: true }
    } else {
      return { isValid: false, error: `API error: ${data.status} - ${data.error_message || "Unknown error"}` }
    }
  } catch (error) {
    return { isValid: false, error: `Network error: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
}

function extractPropertyName(geocodeResult: any): string | undefined {
  // Try to extract a meaningful property name from the geocoding result
  const addressComponents = geocodeResult.address_components || []

  // Look for premise (building name) or establishment
  for (const component of addressComponents) {
    if (component.types.includes("premise") || component.types.includes("establishment")) {
      return component.long_name
    }
  }

  // Fallback to street number + route
  const streetNumber = addressComponents.find((c: any) => c.types.includes("street_number"))?.long_name
  const route = addressComponents.find((c: any) => c.types.includes("route"))?.long_name

  if (streetNumber && route) {
    return `${streetNumber} ${route}`
  }

  return undefined
}
