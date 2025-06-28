"use server"

export async function getGoogleMapsConfig() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey || apiKey === "your_google_maps_api_key_here") {
    return {
      hasValidKey: false,
      error: "Google Maps API key is missing. Please add your API key to the .env.local file.",
    }
  }

  return {
    hasValidKey: true,
    scriptUrl: `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places&callback=initMap`,
  }
}

export async function generateStreetViewUrl(lat: number, lng: number, heading = 0) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey || apiKey === "your_google_maps_api_key_here") {
    return "/placeholder.svg?height=300&width=600"
  }

  const streetViewParams = new URLSearchParams({
    size: "600x400",
    location: `${lat},${lng}`,
    heading: heading.toString(),
    pitch: "10",
    fov: "90",
    key: apiKey,
  })

  return `https://maps.googleapis.com/maps/api/streetview?${streetViewParams.toString()}`
}
