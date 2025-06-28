"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, AlertCircle, Key, Smartphone, Shield, ExternalLink, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SetupGuideProps {
  onApiKeyValidated: (isValid: boolean) => void
  currentApiKey?: string
}

export function SetupGuide({ onApiKeyValidated, currentApiKey }: SetupGuideProps) {
  const [apiKey, setApiKey] = useState(currentApiKey || "")
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<"valid" | "invalid" | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)

  const validateApiKey = async () => {
    if (!apiKey.trim()) return

    setIsValidating(true)
    setValidationResult(null)

    try {
      // Test the API key with a simple geocoding request
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${apiKey}`,
      )

      const data = await response.json()

      if (data.status === "OK") {
        setValidationResult("valid")
        onApiKeyValidated(true)
      } else {
        setValidationResult("invalid")
        onApiKeyValidated(false)
      }
    } catch (error) {
      setValidationResult("invalid")
      onApiKeyValidated(false)
    } finally {
      setIsValidating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const setupSteps = [
    {
      id: "api-key",
      title: "Get Google Maps API Key",
      icon: <Key className="h-5 w-5" />,
      status: validationResult === "valid" ? "complete" : "pending",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You'll need a Google Maps API key to use location services, geocoding, and Street View.
          </p>

          <div className="space-y-3">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Step-by-step instructions:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>
                  Go to the{" "}
                  <a
                    href="https://console.cloud.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Google Cloud Console <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Create a new project or select an existing one</li>
                <li>
                  Enable the following APIs:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Maps JavaScript API</li>
                    <li>Geocoding API</li>
                    <li>Street View Static API</li>
                    <li>Places API (optional)</li>
                  </ul>
                </li>
                <li>Go to "Credentials" and create an API key</li>
                <li>Restrict your API key (recommended for security)</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">Enter your Google Maps API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="api-key"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSyC..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button onClick={validateApiKey} disabled={!apiKey.trim() || isValidating}>
                  {isValidating ? "Validating..." : "Validate"}
                </Button>
              </div>
            </div>

            {validationResult === "valid" && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">API key is valid and working correctly!</AlertDescription>
              </Alert>
            )}

            {validationResult === "invalid" && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  API key validation failed. Please check your key and ensure the required APIs are enabled.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "restrictions",
      title: "Secure Your API Key",
      icon: <Shield className="h-5 w-5" />,
      status: "optional",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Protect your API key from unauthorized use by setting up restrictions.
          </p>

          <div className="space-y-3">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Recommended Restrictions:</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Application restrictions:</strong>
                  <p>HTTP referrers (web sites)</p>
                  <div className="bg-gray-100 p-2 rounded mt-1 font-mono text-xs">
                    https://yourdomain.com/*
                    <br />
                    https://*.yourdomain.com/*
                  </div>
                </div>

                <div>
                  <strong>API restrictions:</strong>
                  <ul className="list-disc list-inside ml-2">
                    <li>Maps JavaScript API</li>
                    <li>Geocoding API</li>
                    <li>Street View Static API</li>
                    <li>Places API</li>
                  </ul>
                </div>
              </div>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Never expose your API key in client-side code for production applications. Consider using environment
                variables and server-side proxies.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      ),
    },
    {
      id: "pwa",
      title: "Install as App",
      icon: <Smartphone className="h-5 w-5" />,
      status: "optional",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Install this app on your device for the best experience.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">📱 Mobile (iOS/Android)</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Open this site in your mobile browser</li>
                <li>Tap the share button</li>
                <li>Select "Add to Home Screen"</li>
                <li>Tap "Add" to confirm</li>
              </ol>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">💻 Desktop (Chrome/Edge)</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Look for the install icon in the address bar</li>
                <li>Click "Install" when prompted</li>
                <li>Or use Chrome menu → "Install app"</li>
              </ol>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">✨ App Benefits:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Works offline for basic functionality</li>
              <li>Faster loading and better performance</li>
              <li>Native app-like experience</li>
              <li>Push notifications (when enabled)</li>
            </ul>
          </div>
        </div>
      ),
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "complete":
        return <Badge className="bg-green-100 text-green-800">Complete</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "optional":
        return <Badge variant="secondary">Optional</Badge>
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Setup Guide</h1>
        <p className="text-gray-600">Get your PulseChain Education Tracker ready for door-to-door sales</p>
      </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="setup">Setup Steps</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          {setupSteps.map((step, index) => (
            <Card key={step.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                      {step.icon}
                    </div>
                    <span>{step.title}</span>
                  </div>
                  {getStatusBadge(step.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>{step.content}</CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Common Issues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">🗺️ Maps not loading</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Check that your API key is valid</li>
                  <li>Ensure Maps JavaScript API is enabled</li>
                  <li>Verify your domain is allowed (if using restrictions)</li>
                  <li>Check browser console for error messages</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">📍 Location services not working</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Allow location access in your browser</li>
                  <li>Ensure you're using HTTPS (required for geolocation)</li>
                  <li>Check that Geocoding API is enabled</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">🖼️ Street View images not showing</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Enable Street View Static API</li>
                  <li>Check API key restrictions</li>
                  <li>Some locations may not have Street View coverage</li>
                </ul>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  If you're still having issues, check the browser console (F12) for detailed error messages.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
