"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { User, Building, MapPin, Target, CheckCircle } from "lucide-react"

interface OnboardingData {
  // Personal Information
  fullName: string
  email: string
  phone: string
  company: string
  role: string

  // Territory Information
  primaryTerritory: string
  territoryType: "residential" | "commercial" | "mixed"
  coverageArea: string

  // Sales Information
  product: string
  targetAudience: string
  salesGoals: string
  experience: "beginner" | "intermediate" | "advanced"

  // Preferences
  notifications: boolean
  dataSharing: boolean
  offlineMode: boolean
}

interface OnboardingFormProps {
  onComplete: (data: OnboardingData) => void
}

export function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<OnboardingData>({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    role: "",
    primaryTerritory: "",
    territoryType: "residential",
    coverageArea: "",
    product: "",
    targetAudience: "",
    salesGoals: "",
    experience: "intermediate",
    notifications: true,
    dataSharing: false,
    offlineMode: true,
  })

  const totalSteps = 4

  const updateFormData = (updates: Partial<OnboardingData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    onComplete(formData)
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.fullName && formData.email && formData.phone
      case 2:
        return formData.primaryTerritory && formData.coverageArea
      case 3:
        return formData.product && formData.targetAudience
      case 4:
        return true
      default:
        return false
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${step <= currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}
          `}
          >
            {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
          </div>
          {step < totalSteps && (
            <div
              className={`
              w-12 h-1 mx-2
              ${step < currentStep ? "bg-blue-600" : "bg-gray-200"}
            `}
            />
          )}
        </div>
      ))}
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <User className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Personal Information</h2>
        <p className="text-gray-600">Let's start with your basic information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => updateFormData({ fullName: e.target.value })}
            placeholder="John Doe"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            placeholder="john@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            placeholder="(555) 123-4567"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => updateFormData({ company: e.target.value })}
            placeholder="Your Company Name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select value={formData.role} onValueChange={(value) => updateFormData({ role: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sales-rep">Sales Representative</SelectItem>
            <SelectItem value="sales-manager">Sales Manager</SelectItem>
            <SelectItem value="team-lead">Team Lead</SelectItem>
            <SelectItem value="independent">Independent Contractor</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Territory Setup</h2>
        <p className="text-gray-600">Define your sales territory</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="primaryTerritory">Primary Territory Name *</Label>
          <Input
            id="primaryTerritory"
            value={formData.primaryTerritory}
            onChange={(e) => updateFormData({ primaryTerritory: e.target.value })}
            placeholder="Downtown District, North Side, etc."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="territoryType">Territory Type *</Label>
          <Select
            value={formData.territoryType}
            onValueChange={(value: "residential" | "commercial" | "mixed") => updateFormData({ territoryType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="mixed">Mixed (Residential & Commercial)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="coverageArea">Coverage Area Description *</Label>
          <Textarea
            id="coverageArea"
            value={formData.coverageArea}
            onChange={(e) => updateFormData({ coverageArea: e.target.value })}
            placeholder="Describe your coverage area (neighborhoods, zip codes, landmarks, etc.)"
            rows={3}
          />
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Sales Information</h2>
        <p className="text-gray-600">Tell us about what you're selling</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="product">Product/Service *</Label>
          <Input
            id="product"
            value={formData.product}
            onChange={(e) => updateFormData({ product: e.target.value })}
            placeholder="Solar panels, Home security, Insurance, etc."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAudience">Target Audience *</Label>
          <Textarea
            id="targetAudience"
            value={formData.targetAudience}
            onChange={(e) => updateFormData({ targetAudience: e.target.value })}
            placeholder="Describe your ideal customers (homeowners, business owners, demographics, etc.)"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="salesGoals">Sales Goals</Label>
          <Textarea
            id="salesGoals"
            value={formData.salesGoals}
            onChange={(e) => updateFormData({ salesGoals: e.target.value })}
            placeholder="What are your sales goals? (daily visits, monthly targets, etc.)"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience">Experience Level</Label>
          <Select
            value={formData.experience}
            onValueChange={(value: "beginner" | "intermediate" | "advanced") => updateFormData({ experience: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner (0-1 years)</SelectItem>
              <SelectItem value="intermediate">Intermediate (1-5 years)</SelectItem>
              <SelectItem value="advanced">Advanced (5+ years)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Building className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Preferences</h2>
        <p className="text-gray-600">Customize your app experience</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notifications"
              checked={formData.notifications}
              onCheckedChange={(checked) => updateFormData({ notifications: !!checked })}
            />
            <Label
              htmlFor="notifications"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Enable push notifications for follow-ups and reminders
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="offlineMode"
              checked={formData.offlineMode}
              onCheckedChange={(checked) => updateFormData({ offlineMode: !!checked })}
            />
            <Label
              htmlFor="offlineMode"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Enable offline mode for areas with poor connectivity
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="dataSharing"
              checked={formData.dataSharing}
              onCheckedChange={(checked) => updateFormData({ dataSharing: !!checked })}
            />
            <Label
              htmlFor="dataSharing"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Share anonymous usage data to help improve the app
            </Label>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Setup Summary</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p>
              <strong>Name:</strong> {formData.fullName}
            </p>
            <p>
              <strong>Territory:</strong> {formData.primaryTerritory}
            </p>
            <p>
              <strong>Product:</strong> {formData.product}
            </p>
            <p>
              <strong>Experience:</strong> {formData.experience}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Welcome to PulseChain Education Tracker</CardTitle>
            {renderStepIndicator()}
          </CardHeader>
          <CardContent>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                Previous
              </Button>

              {currentStep < totalSteps ? (
                <Button onClick={nextStep} disabled={!isStepValid(currentStep)}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleComplete} className="bg-blue-600 hover:bg-blue-700">
                  Complete Setup
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
