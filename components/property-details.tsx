interface PropertyDetailsProps {
  pin: {
    id: string
    lat: number
    lng: number
    address: string
    placeId?: string
    propertyName?: string
    status: string
    timestamp: Date
  }
  streetViewUrl: string
}

export function PropertyDetails({ pin, streetViewUrl }: PropertyDetailsProps) {
  return (
    <div className="space-y-4">
      {/* Street View Image with Address Overlay */}
      <div className="relative">
        <img
          src={streetViewUrl || "/placeholder.svg?height=300&width=600"}
          alt={`Street view of ${pin.propertyName || pin.address}`}
          className="w-full h-64 object-cover rounded-lg border shadow-sm"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=300&width=600"
          }}
        />
        {/* Address Overlay - Top Left */}
        <div className="absolute top-2 left-2 bg-white/80 text-black px-2 py-1 rounded text-xs max-w-[calc(100%-1rem)]">
          {pin.address}
        </div>
      </div>
    </div>
  )
}
