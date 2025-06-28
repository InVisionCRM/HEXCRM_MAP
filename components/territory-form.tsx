"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Palette } from "lucide-react"
import type { Territory } from "@/lib/territory-storage"

interface TerritoryFormProps {
  territory?: Territory | null
  onSave: (territory: Omit<Territory, "id" | "createdAt" | "updatedAt">) => void
  onCancel: () => void
}

const PRESET_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // yellow
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
  "#ec4899", // pink
  "#6b7280", // gray
]

export function TerritoryForm({ territory, onSave, onCancel }: TerritoryFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    color: PRESET_COLORS[0],
    coordinates: [] as Array<{ lat: number; lng: number }>,
  })
  const [isDrawing, setIsDrawing] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (territory) {
      setFormData({
        name: territory.name,
        color: territory.color,
        coordinates: territory.coordinates,
      })
    }
  }, [territory])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name.trim()) {
      setError("Territory name is required")
      return
    }

    if (formData.coordinates.length < 3) {
      setError("Territory must have at least 3 points")
      return
    }

    onSave(formData)
  }

  const handleStartDrawing = () => {
    setIsDrawing(true)
    setFormData((prev) => ({ ...prev, coordinates: [] }))
    setError("")
  }

  const handleClearCoordinates = () => {
    setFormData((prev) => ({ ...prev, coordinates: [] }))
    setIsDrawing(false)
  }

  // Simulate adding coordinates (in real implementation, this would be connected to map clicks)
  const simulateAddCoordinate = () => {
    const newCoord = {
      lat: 40.7128 + (Math.random() - 0.5) * 0.01,
      lng: -74.006 + (Math.random() - 0.5) * 0.01,
    }
    setFormData((prev) => ({
      ...prev,
      coordinates: [...prev.coordinates, newCoord],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Territory Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Territory Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Enter territory name"
          required
        />
      </div>

      {/* Color Selection */}
      <div className="space-y-2">
        <Label>Territory Color</Label>
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-gray-500" />
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`
                  w-8 h-8 rounded-full border-2 transition-all
                  ${formData.color === color ? "border-gray-800 scale-110" : "border-gray-300 hover:border-gray-500"}
                `}
                style={{ backgroundColor: color }}
                onClick={() => setFormData((prev) => ({ ...prev, color }))}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Territory Boundaries */}
      <div className="space-y-3">
        <Label>Territory Boundaries</Label>

        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">{formData.coordinates.length} points defined</span>
            </div>
            <div className="flex gap-2">
              {!isDrawing ? (
                <Button type="button" size="sm" onClick={handleStartDrawing} variant="outline">
                  Start Drawing
                </Button>
              ) : (
                <Button type="button" size="sm" onClick={() => setIsDrawing(false)} variant="outline">
                  Stop Drawing
                </Button>
              )}
              {formData.coordinates.length > 0 && (
                <Button type="button" size="sm" onClick={handleClearCoordinates} variant="outline">
                  Clear
                </Button>
              )}
            </div>
          </div>

          {isDrawing && (
            <div className="mb-3">
              <Alert>
                <MapPin className="h-4 w-4" />
                <AlertDescription>
                  Click on the map to add points to your territory boundary. You need at least 3 points to create a
                  territory.
                  <Button
                    type="button"
                    size="sm"
                    onClick={simulateAddCoordinate}
                    className="ml-2 bg-transparent"
                    variant="outline"
                  >
                    Add Sample Point
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {formData.coordinates.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-gray-600 mb-2">Coordinates:</div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {formData.coordinates.map((coord, index) => (
                  <div key={index} className="text-xs font-mono bg-white p-2 rounded border">
                    Point {index + 1}: {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{territory ? "Update Territory" : "Create Territory"}</Button>
      </div>
    </form>
  )
}
