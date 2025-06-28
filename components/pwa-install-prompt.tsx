"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, Download, Smartphone } from "lucide-react"
import { usePWA } from "@/hooks/use-pwa"

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, installApp } = usePWA()
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed")
    if (dismissed) {
      setIsDismissed(true)
    }
  }, [])

  const handleInstall = async () => {
    const success = await installApp()
    if (success) {
      setIsDismissed(true)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem("pwa-install-dismissed", "true")
  }

  if (!isInstallable || isInstalled || isDismissed) {
    return null
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 shadow-lg border-blue-200 bg-blue-50 md:left-auto md:right-4 md:w-80">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Smartphone className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-blue-900 mb-1">Install App</h3>
            <p className="text-xs text-blue-700 mb-3">Install this app for offline access and better performance</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleInstall} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Download className="h-3 w-3 mr-1" />
                Install
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismiss}
                className="text-blue-600 border-blue-300 bg-transparent"
              >
                Later
              </Button>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={handleDismiss} className="flex-shrink-0 h-6 w-6 p-0 text-blue-600">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
