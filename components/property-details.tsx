import { Badge } from "@/components/ui/badge"
import { MapPin, Building, Clock } from "lucide-react"

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
      {/* Property Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {pin.propertyName && <h3 className="text-lg font-semibold text-gray-900 mb-1">{pin.propertyName}</h3>}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{pin.address}</span>
          </div>
        </div>
        <Badge variant="outline" className="ml-2">
          <Building className="h-3 w-3 mr-1" />
          Property
        </Badge>
      </div>

      {/* Street View Image */}
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
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
          Street View
        </div>
      </div>

      {/* Property Metadata */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Coordinates:</span>
          <p className="font-mono text-xs">
            {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
          </p>
        </div>
        <div>
          <span className="text-gray-600">Added:</span>
          <p className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {(pin.timestamp || pin.createdAt).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  )
}
