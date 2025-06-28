"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Save, Square, Palette } from "lucide-react"

interface TerritoryFormProps {
  coordinates: Array<{ lat: number; lng: number }>
  onSave: (name: string, color: string) => void
  onCancel: () => void
}

const TERRITORY_COLORS = [
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#22c55e", // Green
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#f97316", // Orange
  "#6366f1", // Indigo
]

export function TerritoryForm({ coordinates, onSave, onCancel }: TerritoryFormProps) {
  const [name, setName] = useState("")
  const [selectedColor, setSelectedColor] = useState(TERRITORY_COLORS[0])
  const [errors, setErrors] = useState<{ name?: string }>({})

  const validateForm = () => {
    const newErrors: { name?: string } = {}

    if (!name.trim()) {
      newErrors.name = "Territory name is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validateForm()) {
      return
    }

    onSave(name.trim(), selectedColor)
  }

  const getPolygonArea = () => {
    if (coordinates.length < 3) return "0"

    // Simple area calculation for display
    const bounds = coordinates.reduce(
      (acc, coord) => ({
        minLat: Math.min(acc.minLat, coord.lat),
        maxLat: Math.max(acc.maxLat, coord.lat),
        minLng: Math.min(acc.minLng, coord.lng),
        maxLng: Math.max(acc.maxLng, coord.lng),
      }),
      {
        minLat: coordinates[0].lat,
        maxLat: coordinates[0].lat,
        minLng: coordinates[0].lng,
        maxLng: coordinates[0].lng,
      },
    )

    const area = Math.abs((bounds.maxLat - bounds.minLat) * (bounds.maxLng - bounds.minLng))
    return (area * 10000).toFixed(2) // Rough conversion for display
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-purple-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-purple-700 text-lg">
              <Square className="h-5 w-5 text-blue-600" />
              Create Territory
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-purple-700 hover:bg-purple-50">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Territory Info */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 text-sm text-purple-600 mb-1">
              <Square className="h-4 w-4" />
              <span>Territory Details</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Points:</span>
                <p className="font-mono text-xs">{coordinates.length}</p>
              </div>
              <div>
                <span className="text-gray-600">Area (approx):</span>
                <p className="font-mono text-xs">{getPolygonArea()} units</p>
              </div>
            </div>
          </div>

          {/* Territory Name */}
          <div className="space-y-2">
            <Label htmlFor="territory-name" className="flex items-center gap-2 text-purple-700">
              <Square className="h-4 w-4" />
              Territory Name *
            </Label>
            <Input
              id="territory-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for this territory"
              className={`border-purple-200 focus:border-purple-400 ${errors.name ? "border-red-500" : ""}`}
              required
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-purple-700">
              <Palette className="h-4 w-4" />
              Territory Color
            </Label>
            <div className="grid grid-cols-5 gap-3">
              {TERRITORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-12 h-12 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedColor === color
                      ? "border-purple-500 ring-2 ring-purple-300 scale-105"
                      : "border-gray-300 hover:border-purple-300"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <p className="text-xs text-gray-600">Selected color: {selectedColor}</p>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-3 rounded-lg border">
            <h4 className="font-semibold mb-2 text-sm">Preview:</h4>
            <div className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded border-2 border-white shadow-sm"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="text-sm font-medium">{name || "Unnamed Territory"}</span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 bg-transparent border-purple-200 text-purple-700 hover:bg-purple-50 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Create Territory
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-800">
              <strong>Tip:</strong> Choose a descriptive name and distinct color for easy identification. You can edit
              or delete this territory later using the Territory Manager.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
