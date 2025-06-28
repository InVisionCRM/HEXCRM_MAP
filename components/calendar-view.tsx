"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, X, Calendar, Clock, MapPin, ArrowLeft } from "lucide-react"
import { GlowingEffect } from "@/components/ui/glowing-effect"

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

interface CalendarViewProps {
  followUps: FollowUpData[]
  onClose: () => void
}

export function CalendarView({ followUps, onClose }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }

  const getFollowUpsForDate = (date: string) => {
    return followUps.filter((followUp) => followUp.date === date)
  }

  const formatDateString = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  const hasFollowUpOnDate = (day: number) => {
    if (!day) return false
    const dateString = formatDateString(currentDate.getFullYear(), currentDate.getMonth(), day)
    return getFollowUpsForDate(dateString).length > 0
  }

  const handleDateClick = (day: number) => {
    if (!day) return
    const dateString = formatDateString(currentDate.getFullYear(), currentDate.getMonth(), day)
    const dayFollowUps = getFollowUpsForDate(dateString)
    if (dayFollowUps.length > 0) {
      setSelectedDate(dateString)
    }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const days = getDaysInMonth(currentDate)
  const selectedDateFollowUps = selectedDate ? getFollowUpsForDate(selectedDate) : []

  if (selectedDate) {
    // Day view
    return (
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedDate(null)
          }
        }}
      >
        <div className="relative w-full max-w-md">
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
          />
          <Card className="bg-white/95 backdrop-blur-sm border-purple-200 shadow-xl max-h-[80vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-purple-700 text-base sm:text-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="truncate">
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate(null)}
                  className="text-purple-700 hover:bg-purple-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose} className="text-purple-700 hover:bg-purple-50">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDateFollowUps.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">No follow-ups scheduled for this day</p>
            ) : (
              selectedDateFollowUps.map((followUp) => (
                <div key={followUp.id} className="relative">
                  <GlowingEffect
                    spread={20}
                    glow={true}
                    disabled={false}
                    proximity={32}
                    inactiveZone={0.01}
                  />
                  <Card className="border border-blue-200 bg-blue-50/50">
                  <CardContent className="p-3 sm:p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-blue-300 text-blue-700 text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(followUp.time)}
                      </Badge>
                    </div>

                    <div>
                      {followUp.propertyName && (
                        <p className="font-medium text-sm break-words">{followUp.propertyName}</p>
                      )}
                      <div className="flex items-start gap-1 text-sm text-gray-600">
                        <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span className="break-words">{followUp.address}</span>
                      </div>
                    </div>

                    {followUp.notes && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600">Notes:</p>
                        <p className="text-sm text-gray-800 break-words">{followUp.notes}</p>
                      </div>
                    )}
                  </CardContent>
                  </Card>
                </div>
              ))
            )}
          </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Calendar view
  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="relative w-full max-w-md">
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
              <Calendar className="h-5 w-5 text-blue-600" />
              Follow-up Calendar
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-purple-700 hover:bg-purple-50">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("prev")}
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-base sm:text-lg font-semibold text-purple-700 truncate">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("next")}
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 p-1 sm:p-2">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day, index) => (
              <div
                key={index}
                className={`
                  relative text-center p-1 sm:p-2 text-sm cursor-pointer rounded-md transition-colors min-h-[32px] sm:min-h-[36px] flex items-center justify-center
                  ${day ? "hover:bg-purple-50" : ""}
                  ${day && hasFollowUpOnDate(day) ? "bg-blue-50 border border-blue-200" : ""}
                `}
                onClick={() => day && handleDateClick(day)}
              >
                {day && (
                  <>
                    <span className={hasFollowUpOnDate(day) ? "text-blue-700 font-medium" : "text-gray-700"}>
                      {day}
                    </span>
                    {hasFollowUpOnDate(day) && (
                      <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-600 pt-2 border-t border-purple-100">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Has Follow-ups</span>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-800 text-center">
              <strong>{followUps.length}</strong> total follow-ups scheduled
            </p>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  )
}
