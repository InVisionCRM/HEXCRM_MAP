"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MapPin, MoreVertical, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { type Territory, territoryStorage } from "@/lib/territory-storage"
import { TerritoryForm } from "./territory-form"
import { useToast } from "@/hooks/use-toast"

interface TerritoryManagerProps {
  onTerritorySelect?: (territory: Territory | null) => void
  selectedTerritoryId?: string
  visibleTerritories: Set<string>
  onToggleVisibility: (territoryId: string) => void
}

export function TerritoryManager({
  onTerritorySelect,
  selectedTerritoryId,
  visibleTerritories,
  onToggleVisibility,
}: TerritoryManagerProps) {
  const [territories, setTerritories] = useState<Territory[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadTerritories()
  }, [])

  const loadTerritories = async () => {
    try {
      setIsLoading(true)
      const loadedTerritories = await territoryStorage.getTerritories()
      setTerritories(loadedTerritories)
    } catch (error) {
      console.error("Error loading territories:", error)
      toast({
        title: "Error",
        description: "Failed to load territories",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTerritory = async (territoryData: Omit<Territory, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (editingTerritory) {
        // Update existing territory
        const updatedTerritory: Territory = {
          ...editingTerritory,
          ...territoryData,
          updatedAt: new Date(),
        }
        await territoryStorage.saveTerritory(updatedTerritory)
        setTerritories((prev) => prev.map((t) => (t.id === editingTerritory.id ? updatedTerritory : t)))
        toast({
          title: "Success",
          description: "Territory updated successfully",
        })
      } else {
        // Create new territory
        const newTerritory: Territory = {
          id: crypto.randomUUID(),
          ...territoryData,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        await territoryStorage.saveTerritory(newTerritory)
        setTerritories((prev) => [...prev, newTerritory])
        toast({
          title: "Success",
          description: "Territory created successfully",
        })
      }

      setIsFormOpen(false)
      setEditingTerritory(null)
    } catch (error) {
      console.error("Error saving territory:", error)
      toast({
        title: "Error",
        description: "Failed to save territory",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTerritory = async (territory: Territory) => {
    try {
      await territoryStorage.deleteTerritory(territory.id)
      setTerritories((prev) => prev.filter((t) => t.id !== territory.id))

      // If this was the selected territory, deselect it
      if (selectedTerritoryId === territory.id) {
        onTerritorySelect?.(null)
      }

      toast({
        title: "Success",
        description: "Territory deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting territory:", error)
      toast({
        title: "Error",
        description: "Failed to delete territory",
        variant: "destructive",
      })
    }
  }

  const handleEditTerritory = (territory: Territory) => {
    setEditingTerritory(territory)
    setIsFormOpen(true)
  }

  const handleCreateNew = () => {
    setEditingTerritory(null)
    setIsFormOpen(true)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Territories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Territories
          </CardTitle>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingTerritory ? "Edit Territory" : "Create New Territory"}</DialogTitle>
              </DialogHeader>
              <TerritoryForm
                territory={editingTerritory}
                onSave={handleSaveTerritory}
                onCancel={() => {
                  setIsFormOpen(false)
                  setEditingTerritory(null)
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {territories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No territories created yet</p>
              <p className="text-xs text-gray-400">Create your first territory to get started</p>
            </div>
          ) : (
            territories.map((territory) => (
              <div
                key={territory.id}
                className={`
                  border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md
                  ${
                    selectedTerritoryId === territory.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }
                `}
                onClick={() => onTerritorySelect?.(territory)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: territory.color }}
                      />
                      <h3 className="font-medium text-sm truncate">{territory.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{territory.coordinates.length} points</span>
                      <Badge variant="outline" className="text-xs">
                        {territory.createdAt.toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleVisibility(territory.id)
                      }}
                      className="h-8 w-8 p-0"
                    >
                      {visibleTerritories.has(territory.id) ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" onClick={(e) => e.stopPropagation()} className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditTerritory(territory)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteTerritory(territory)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
