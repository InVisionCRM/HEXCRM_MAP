"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Calendar, Clock, X, MapPin, Save } from "lucide-react"

interface Pin {
  id: string
  lat: number
  lng: number
  address: string
  placeId?: string
  propertyName?: string
  status: string
  timestamp: Date
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
}

interface FollowUpModalProps {
  pin: Pin
  onSave: (data: FollowUpData) => void
  onCancel: () => void
}

export function FollowUpModal({ pin, onSave, onCancel }: FollowUpModalProps) {
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<{ date?: string; time?: string }>({})

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0]

  const validateForm = () => {
    const newErrors: { date?: string; time?: string } = {}

    if (!date) {
      newErrors.date = "Date is required"
    }

    if (!time) {
      newErrors.time = "Time is required"
    }

    // Check if date is not in the past
    if (date && new Date(date) < new Date(today)) {
      newErrors.date = "Date cannot be in the past"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSaving(true)

    try {
      const followUpData: FollowUpData = {
        id: Date.now().toString(),
        pinId: pin.id,
        address: pin.address,
        propertyName: pin.propertyName,
        date,
        time,
        notes: notes.trim() || undefined,
        timestamp: new Date(),
      }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      onSave(followUpData)

      toast({
        title: "Follow-up Scheduled!",
        description: `Appointment scheduled for ${new Date(date).toLocaleDateString()} at ${time}`,
      })
    } catch (error) {
      console.error("Error saving follow-up:", error)
      toast({
        title: "Error",
        description: "Failed to schedule follow-up. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-purple-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-purple-700 text-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
              Schedule Follow-up
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-purple-700 hover:bg-purple-50">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            {/* Location Info */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 text-sm text-purple-600 mb-1">
                <MapPin className="h-4 w-4" />
                <span>Location</span>
              </div>
              {pin.propertyName && <p className="font-medium text-sm break-words">{pin.propertyName}</p>}
              <p className="text-sm text-gray-700 break-words">{pin.address}</p>
              <Badge variant="outline" className="mt-2 border-blue-200 text-blue-700">
                Follow-up Required
              </Badge>
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2 text-purple-700">
                <Calendar className="h-4 w-4" />
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={today}
                className={`border-purple-200 focus:border-purple-400 ${errors.date ? "border-red-500" : ""}`}
                required
              />
              {errors.date && <p className="text-sm text-red-600">{errors.date}</p>}
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2 text-purple-700">
                <Clock className="h-4 w-4" />
                Time *
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={`border-purple-200 focus:border-purple-400 ${errors.time ? "border-red-500" : ""}`}
                required
              />
              {errors.time && <p className="text-sm text-red-600">{errors.time}</p>}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2 text-purple-700">
                <Clock className="h-4 w-4" />
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this follow-up appointment..."
                rows={3}
                className="resize-none border-purple-200 focus:border-purple-400"
              />
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
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Scheduling..." : "Schedule Follow-up"}
              </Button>
            </div>
          </form>

          {/* Form Info */}
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-800">
              <strong>Tip:</strong> Choose a convenient time for both you and the customer. You can add notes to
              remember specific details about this follow-up.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
