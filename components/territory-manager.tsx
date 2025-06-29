"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { X, MapPin, Edit3, Trash2, Save, Square, Eye, EyeOff } from "lucide-react"
import type { Territory } from "@/lib/territory-storage"
import GlowingEffect from "@/components/ui/glowing-effect"

interface TerritoryManagerProps {
  territories: Territory[]
  onClose: () => void
  onUpdateTerritory: (territory: Territory) => void
  onDeleteTerritory: (id: string) => void
  onToggleTerritoryVisibility: (id: string) => void
  visibleTerritories: Set<string>
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

export function TerritoryManager({
  territories,
  onClose,
  onUpdateTerritory,
  onDeleteTerritory,
  onToggleTerritoryVisibility,
  visibleTerritories,
}: TerritoryManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")

  const handleStartEdit = (territory: Territory) => {
    setEditingId(territory.id)
    setEditName(territory.name)
    setEditColor(territory.color)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return

    const territory = territories.find((t) => t.id === editingId)
    if (!territory) return

    const updatedTerritory = {
      ...territory,
      name: editName.trim(),
      color: editColor,
      updatedAt: new Date(),
    }

    onUpdateTerritory(updatedTerritory)
    setEditingId(null)
    setEditName("")
    setEditColor("")

    toast({
      title: "Territory Updated",
      description: `"${updatedTerritory.name}" has been updated successfully.`,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditColor("")
  }

  const handleDelete = (territory: Territory) => {
    if (confirm(`Are you sure you want to delete "${territory.name}"? This action cannot be undone.`)) {
      onDeleteTerritory(territory.id)
      toast({
        title: "Territory Deleted",
        description: `"${territory.name}" has been deleted.`,
        variant: "destructive",
      })
    }
  }

  const getTerritoryArea = (coordinates: Array<{ lat: number; lng: number }>) => {
    if (coordinates.length < 3) return "0"

    // Simple area calculation for display (not exact)
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
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="relative w-full max-w-2xl">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <Card className="bg-white/95 backdrop-blur-sm border-purple-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-purple-700 text-lg">
              <Square className="h-5 w-5 text-blue-600" />
              Territory Manager
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-purple-700 hover:bg-purple-50">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 text-sm text-purple-600 mb-1">
              <MapPin className="h-4 w-4" />
              <span>Territory Overview</span>
            </div>
            <p className="text-sm text-gray-700">
              <strong>{territories.length}</strong> territories created
            </p>
            <p className="text-xs text-gray-600 mt-1">Click the eye icon to show/hide territories on the map</p>
          </div>

          {/* Territory List */}
          {territories.length === 0 ? (
            <div className="text-center py-8">
              <Square className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No territories created yet</p>
              <p className="text-sm text-gray-400">Click the drawing tools on the map to create your first territory</p>
            </div>
          ) : (
            <div className="space-y-3">
              {territories.map((territory) => (
                <div key={territory.id} className="relative">
                  <GlowingEffect
                    spread={20}
                    glow={true}
                    disabled={false}
                    proximity={32}
                    inactiveZone={0.01}
                  />
                  <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    {editingId === territory.id ? (
                      /* Edit Mode */
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="edit-name" className="text-sm font-medium text-purple-700">
                            Territory Name
                          </Label>
                          <Input
                            id="edit-name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Enter territory name"
                            className="border-purple-200 focus:border-purple-400"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-purple-700">Territory Color</Label>
                          <div className="flex gap-2 flex-wrap">
                            {TERRITORY_COLORS.map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setEditColor(color)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${
                                  editColor === color
                                    ? "border-purple-500 scale-110"
                                    : "border-gray-300 hover:border-purple-300"
                                }`}
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={!editName.trim()}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full border border-white shadow-sm"
                              style={{ backgroundColor: territory.color }}
                            />
                            <div>
                              <h3 className="font-semibold text-gray-900 break-words">{territory.name}</h3>
                              <p className="text-xs text-gray-500">
                                Created {territory.createdAt.toLocaleDateString()}
                                {territory.updatedAt && territory.updatedAt !== territory.createdAt && (
                                  <span> • Updated {territory.updatedAt.toLocaleDateString()}</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onToggleTerritoryVisibility(territory.id)}
                              className="text-gray-600 hover:bg-gray-100"
                              title={visibleTerritories.has(territory.id) ? "Hide territory" : "Show territory"}
                            >
                              {visibleTerritories.has(territory.id) ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStartEdit(territory)}
                              className="text-blue-600 hover:bg-blue-50"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(territory)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Points:</span>
                            <p className="font-mono text-xs">{territory.coordinates.length}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Area (approx):</span>
                            <p className="font-mono text-xs">{getTerritoryArea(territory.coordinates)} units</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              visibleTerritories.has(territory.id)
                                ? "border-green-300 text-green-700"
                                : "border-gray-300 text-gray-600"
                            }`}
                          >
                            {visibleTerritories.has(territory.id) ? "Visible" : "Hidden"}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-purple-200">
            <h4 className="font-semibold mb-2 text-sm text-purple-700">How to create territories:</h4>
            <ol className="list-decimal list-inside space-y-1 text-xs text-purple-800">
              <li>Click the polygon tool in the drawing controls</li>
              <li>Click on the map to create polygon points</li>
              <li>Double-click to complete the territory</li>
              <li>Give your territory a name and choose a color</li>
              <li>Use this manager to edit, hide, or delete territories</li>
            </ol>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  )
}
