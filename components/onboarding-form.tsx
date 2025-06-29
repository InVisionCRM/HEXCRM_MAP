"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import {
  CheckCircle,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Bitcoin,
  Twitter,
  MessageCircle,
  Send,
  StickyNote,
  Users,
} from "lucide-react"
import GlowingEffect from "@/components/ui/glowing-effect"

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

interface OnboardData {
  firstName: string
  phone?: string
  email?: string
  ownsCrypto?: boolean
  socials: {
    twitter?: string
    telegram?: string
    reddit?: string
  }
  notes?: string
  pinId: string
  address: string
  timestamp: Date
}

interface OnboardingFormProps {
  pin: Pin
  onSubmit: (data: OnboardData) => void
  onCancel: () => void
}

export function OnboardingForm({ pin, onSubmit, onCancel }: OnboardingFormProps) {
  const [firstName, setFirstName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [ownsCrypto, setOwnsCrypto] = useState(false)
  const [twitter, setTwitter] = useState("")
  const [telegram, setTelegram] = useState("")
  const [reddit, setReddit] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [promoSent, setPromoSent] = useState(false)
  const [errors, setErrors] = useState<{ firstName?: string; phone?: string; email?: string }>({})

  const validateForm = () => {
    const newErrors: { firstName?: string; phone?: string; email?: string } = {}

    // First name is required
    if (!firstName.trim()) {
      newErrors.firstName = "First name is required"
    }

    // Phone validation (optional but must be valid if provided)
    if (phone && !/^\+?[\d\s\-()]{10,}$/.test(phone.replace(/\s/g, ""))) {
      newErrors.phone = "Please enter a valid phone number"
    }

    // Email validation (optional but must be valid if provided)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSendPromo = async () => {
    if (!email) return

    setPromoSent(true)
    toast({
      title: "Promo Material Sent!",
      description: `PulseChain educational materials have been sent to ${email}`,
    })

    // Simulate API call
    setTimeout(() => setPromoSent(false), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const onboardData: OnboardData = {
        firstName: firstName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        ownsCrypto,
        socials: {
          twitter: twitter.trim() || undefined,
          telegram: telegram.trim() || undefined,
          reddit: reddit.trim() || undefined,
        },
        notes: notes.trim() || undefined,
        pinId: pin.id,
        address: pin.address,
        timestamp: new Date(),
      }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      onSubmit(onboardData)
    } catch (error) {
      console.error("Error submitting onboard form:", error)
      toast({
        title: "Error",
        description: "Failed to submit form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, "")
    if (phoneNumber.length >= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
    } else if (phoneNumber.length >= 3) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
    } else {
      return phoneNumber
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
  }

  const formatSocialHandle = (value: string, platform: string) => {
    // Remove @ symbol if user adds it
    let handle = value.replace(/^@/, "")

    // Remove platform URLs if user pastes them
    if (platform === "twitter") {
      handle = handle.replace(/^(https?:\/\/)?(www\.)?(twitter\.com\/|x\.com\/)?/, "")
    } else if (platform === "telegram") {
      handle = handle.replace(/^(https?:\/\/)?(www\.)?(t\.me\/)?/, "")
    } else if (platform === "reddit") {
      handle = handle.replace(/^(https?:\/\/)?(www\.)?(reddit\.com\/u\/)?/, "")
    }

    return handle
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="relative w-full max-w-lg">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <Card className="bg-white/95 backdrop-blur-sm max-h-[90vh] overflow-y-auto border-purple-200 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-purple-700 text-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              New Customer Onboarding
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-purple-700 hover:bg-purple-50">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Location Info */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 text-sm text-purple-600 mb-1">
                <MapPin className="h-4 w-4" />
                <span>Location</span>
              </div>
              {pin.propertyName && <p className="font-medium text-sm break-words">{pin.propertyName}</p>}
              <p className="text-sm text-gray-700 break-words">{pin.address}</p>
              <Badge variant="outline" className="mt-2 border-purple-200 text-purple-700">
                New Customer
              </Badge>
            </div>

            {/* First Name - Required */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="flex items-center gap-2 text-purple-700">
                <User className="h-4 w-4" />
                First Name *
              </Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter customer's first name"
                className={`border-purple-200 focus:border-purple-400 ${errors.firstName ? "border-red-500" : ""}`}
                required
              />
              {errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
            </div>

            {/* Phone - Optional */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2 text-purple-700">
                <Phone className="h-4 w-4" />
                Phone Number (Optional)
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(555) 123-4567"
                className={`border-purple-200 focus:border-purple-400 ${errors.phone ? "border-red-500" : ""}`}
                maxLength={14}
              />
              {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
            </div>

            {/* Email - Optional */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-purple-700">
                <Mail className="h-4 w-4" />
                Email Address (Optional)
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className={`border-purple-200 focus:border-purple-400 ${errors.email ? "border-red-500" : ""}`}
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Owns Crypto - Optional */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ownsCrypto"
                checked={ownsCrypto}
                onCheckedChange={(checked) => setOwnsCrypto(checked as boolean)}
                className="border-purple-300 data-[state=checked]:bg-purple-600"
              />
              <Label htmlFor="ownsCrypto" className="flex items-center gap-2 text-sm text-purple-700">
                <Bitcoin className="h-4 w-4" />
                Owns Cryptocurrency (Optional)
              </Label>
            </div>

            {/* Social Media Handles */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-purple-700">Social Media (Optional)</Label>

              {/* Twitter */}
              <div className="space-y-1">
                <Label htmlFor="twitter" className="flex items-center gap-2 text-sm text-purple-600">
                  <Twitter className="h-4 w-4" />
                  Twitter/X Handle
                </Label>
                <Input
                  id="twitter"
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(formatSocialHandle(e.target.value, "twitter"))}
                  placeholder="username"
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              {/* Telegram */}
              <div className="space-y-1">
                <Label htmlFor="telegram" className="flex items-center gap-2 text-sm text-purple-600">
                  <MessageCircle className="h-4 w-4" />
                  Telegram Handle
                </Label>
                <Input
                  id="telegram"
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(formatSocialHandle(e.target.value, "telegram"))}
                  placeholder="username"
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              {/* Reddit */}
              <div className="space-y-1">
                <Label htmlFor="reddit" className="flex items-center gap-2 text-sm text-purple-600">
                  <MessageCircle className="h-4 w-4" />
                  Reddit Username
                </Label>
                <Input
                  id="reddit"
                  type="text"
                  value={reddit}
                  onChange={(e) => setReddit(formatSocialHandle(e.target.value, "reddit"))}
                  placeholder="username"
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>
            </div>

            {/* Send Promo Material Button */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent border-purple-200 text-purple-700 hover:bg-purple-50 text-sm"
                onClick={handleSendPromo}
                disabled={!email || promoSent}
              >
                <Send className="h-4 w-4 mr-2" />
                {promoSent ? "PulseChain Materials Sent!" : "Send PulseChain Materials"}
              </Button>
              {!email && (
                <p className="text-xs text-purple-600">Email address required to send educational materials</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2 text-purple-700">
                <StickyNote className="h-4 w-4" />
                Add Note (Optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this customer or interaction..."
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
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-sm"
              >
                {isSubmitting ? "Processing..." : "Onboard Now!"}
              </Button>
            </div>
          </form>

          {/* Form Info */}
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-800">
              <strong>Note:</strong> Only first name is required. All other fields are optional but help with PulseChain
              education follow-up and engagement.
            </p>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  )
}
