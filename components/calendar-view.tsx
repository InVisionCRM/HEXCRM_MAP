"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { format, isSameDay } from "date-fns"
import { CalendarIcon, Clock, MapPin, Phone, Mail, User } from "lucide-react"
import type { FollowUpData } from "./follow-up-modal"

interface CalendarViewProps {
  followUps: FollowUpData[]
  onUpdateFollowUp: (id: string, updates: Partial<FollowUpData>) => void
}

export function CalendarView({ followUps, onUpdateFollowUp }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUpData | null>(null)

  // Get follow-ups for selected date
  const dayFollowUps = followUps
    .filter((followUp) => isSameDay(followUp.date, selectedDate))
    .sort((a, b) => a.time.localeCompare(b.time))

  // Get dates that have follow-ups for calendar highlighting
  const followUpDates = followUps.map((f) => f.date)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "callback":
        return <Phone className="h-4 w-4" />
      case "visit":
        return <MapPin className="h-4 w-4" />
      case "email":
        return <Mail className="h-4 w-4" />
      default:
        return <CalendarIcon className="h-4 w-4" />
    }
  }

  const handleMarkComplete = (followUpId: string) => {
    onUpdateFollowUp(followUpId, { status: "completed" })
    setSelectedFollowUp(null)
  }

  const handleMarkCancelled = (followUpId: string) => {
    onUpdateFollowUp(followUpId, { status: "cancelled" })
    setSelectedFollowUp(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Follow-up Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            modifiers={{
              hasFollowUp: followUpDates,
            }}
            modifiersStyles={{
              hasFollowUp: {
                backgroundColor: "#3b82f6",
                color: "white",
                fontWeight: "bold",
              },
            }}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {/* Day's Follow-ups */}
      <Card>
        <CardHeader>
          <CardTitle>{format(selectedDate, "EEEE, MMMM d, yyyy")}</CardTitle>
          <p className="text-sm text-gray-600">
            {dayFollowUps.length} follow-up{dayFollowUps.length !== 1 ? "s" : ""} scheduled
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dayFollowUps.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No follow-ups scheduled for this day</p>
            ) : (
              dayFollowUps.map((followUp) => (
                <div
                  key={followUp.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedFollowUp(followUp)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeIcon(followUp.type)}
                        <span className="font-medium capitalize">{followUp.type}</span>
                        <Badge className={getPriorityColor(followUp.priority)}>{followUp.priority}</Badge>
                        <Badge
                          variant={
                            followUp.status === "completed"
                              ? "default"
                              : followUp.status === "cancelled"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {followUp.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Clock className="h-4 w-4" />
                        <span>{followUp.time}</span>
                      </div>

                      {followUp.customerName && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <User className="h-4 w-4" />
                          <span>{followUp.customerName}</span>
                        </div>
                      )}

                      {followUp.notes && <p className="text-sm text-gray-700 mt-2">{followUp.notes}</p>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Follow-up Detail Modal */}
      {selectedFollowUp && (
        <Dialog open={!!selectedFollowUp} onOpenChange={() => setSelectedFollowUp(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getTypeIcon(selectedFollowUp.type)}
                Follow-up Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge className={getPriorityColor(selectedFollowUp.priority)}>
                  {selectedFollowUp.priority} priority
                </Badge>
                <Badge
                  variant={
                    selectedFollowUp.status === "completed"
                      ? "default"
                      : selectedFollowUp.status === "cancelled"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {selectedFollowUp.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Type:</span>
                  <p className="font-medium capitalize">{selectedFollowUp.type}</p>
                </div>
                <div>
                  <span className="text-gray-600">Date & Time:</span>
                  <p className="font-medium">
                    {format(selectedFollowUp.date, "MMM d, yyyy")} at {selectedFollowUp.time}
                  </p>
                </div>
              </div>

              {(selectedFollowUp.customerName || selectedFollowUp.customerPhone || selectedFollowUp.customerEmail) && (
                <div className="space-y-2">
                  <h4 className="font-medium">Customer Information</h4>
                  {selectedFollowUp.customerName && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{selectedFollowUp.customerName}</span>
                    </div>
                  )}
                  {selectedFollowUp.customerPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedFollowUp.customerPhone}</span>
                    </div>
                  )}
                  {selectedFollowUp.customerEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{selectedFollowUp.customerEmail}</span>
                    </div>
                  )}
                </div>
              )}

              {selectedFollowUp.notes && (
                <div className="space-y-2">
                  <h4 className="font-medium">Notes</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{selectedFollowUp.notes}</p>
                </div>
              )}

              {selectedFollowUp.status === "pending" && (
                <div className="flex gap-2 pt-4">
                  <Button onClick={() => handleMarkComplete(selectedFollowUp.id)} className="flex-1">
                    Mark Complete
                  </Button>
                  <Button variant="outline" onClick={() => handleMarkCancelled(selectedFollowUp.id)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
