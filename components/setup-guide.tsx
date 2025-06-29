import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Key, Settings, Globe } from "lucide-react"
import GlowingEffect from "@/components/ui/glowing-effect"

export function SetupGuide() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Google Maps API Setup</h1>
        <p className="text-gray-600">Follow these steps to configure your Google Maps API key</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="relative">
          <GlowingEffect
            spread={30}
            glow={true}
            disabled={false}
            proximity={48}
            inactiveZone={0.01}
          />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Step 1: Google Cloud Console
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>Go to the Google Cloud Console and create or select a project.</p>
              <a
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:underline"
              >
                Open Google Cloud Console
                <ExternalLink className="h-4 w-4" />
              </a>
            </CardContent>
          </Card>
        </div>

        <div className="relative">
          <GlowingEffect
            spread={30}
            glow={true}
            disabled={false}
            proximity={48}
            inactiveZone={0.01}
          />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Step 2: Enable APIs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>Enable these APIs in your project:</p>
              <div className="space-y-1">
                <Badge variant="outline">Maps JavaScript API</Badge>
                <Badge variant="outline">Geocoding API</Badge>
                <Badge variant="outline">Street View Static API</Badge>
                <Badge variant="outline">Places API</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="relative">
          <GlowingEffect
            spread={30}
            glow={true}
            disabled={false}
            proximity={48}
            inactiveZone={0.01}
          />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Step 3: Create API Key
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>Create an API key in the "Credentials" section.</p>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Security:</strong> Restrict your API key to specific domains in production.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="relative">
          <GlowingEffect
            spread={30}
            glow={true}
            disabled={false}
            proximity={48}
            inactiveZone={0.01}
          />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Step 4: Configure Environment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>Add your API key to your environment variables:</p>
              <div className="bg-gray-100 p-3 rounded-lg">
                <code className="text-sm">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here</code>
              </div>
              <p className="text-sm text-gray-600">Then restart your development server.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="relative">
        <GlowingEffect
          spread={30}
          glow={true}
          disabled={false}
          proximity={48}
          inactiveZone={0.01}
        />
        <Card className="bg-blue-50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">💡 Pro Tips:</h3>
            <ul className="space-y-1 text-sm">
              <li>• Set up billing in Google Cloud Console (required for Maps APIs)</li>
              <li>• Monitor your API usage to avoid unexpected charges</li>
              <li>• Use API key restrictions for security</li>
              <li>• Consider setting up quotas to control costs</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
