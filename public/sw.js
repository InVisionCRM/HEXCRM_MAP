const CACHE_NAME = "pulsechain-tracker-v1"
const STATIC_CACHE = "pulsechain-static-v1"
const DYNAMIC_CACHE = "pulsechain-dynamic-v1"

// Assets to cache immediately
const urlsToCache = ["/", "/offline.html", "/icons/icon-192x192.png", "/icons/icon-512x512.png", "/pulsechain-logo.png"]

// Google Maps and external resources
const EXTERNAL_RESOURCES = ["https://maps.googleapis.com", "https://fonts.googleapis.com", "https://fonts.gstatic.com"]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...")

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching static assets")
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        console.log("Service Worker: Static assets cached")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("Service Worker: Error caching static assets", error)
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...")

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log("Service Worker: Deleting old cache", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("Service Worker: Activated")
        return self.clients.claim()
      }),
  )
})

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Handle navigation requests
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, responseClone))
          }
          return response
        })
        .catch(() => {
          // Serve offline page if navigation fails
          return caches.match("/offline.html")
        }),
    )
    return
  }

  // Handle static assets
  if (urlsToCache.some((asset) => request.url.includes(asset))) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request)
      }),
    )
    return
  }

  // Handle Google Maps API requests
  if (url.hostname === "maps.googleapis.com") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses for 1 hour
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
              // Set expiration for 1 hour
              setTimeout(() => {
                cache.delete(request)
              }, 3600000)
            })
          }
          return response
        })
        .catch(() => {
          // Try to serve from cache if network fails
          return caches.match(request)
        }),
    )
    return
  }

  // Handle Street View images
  if (url.hostname === "maps.googleapis.com" && url.pathname.includes("streetview")) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response
        }

        return fetch(request)
          .then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone()
              caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, responseClone))
            }
            return response
          })
          .catch(() => {
            // Return placeholder image if Street View fails
            return new Response(
              '<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280">Street View Unavailable</text></svg>',
              { headers: { "Content-Type": "image/svg+xml" } },
            )
          })
      }),
    )
    return
  }

  // Default fetch strategy
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
      .catch(() => {
        // If both cache and network fail, show offline page
        if (event.request.destination === "document") {
          return caches.match("/offline.html")
        }
      }),
  )
})

// Background sync for offline data
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync triggered", event.tag)

  if (event.tag === "sync-pins") {
    event.waitUntil(syncPins())
  }

  if (event.tag === "sync-followups") {
    event.waitUntil(syncFollowUps())
  }
})

// Push notification handler
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push notification received")

  const options = {
    body: event.data ? event.data.text() : "You have a follow-up appointment today!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "view",
        title: "View Details",
        icon: "/icons/action-view.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icons/action-close.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("PulseChain Tracker", options))
})

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked", event.action)

  event.notification.close()

  if (event.action === "view") {
    event.waitUntil(clients.openWindow("/?action=calendar"))
  }
})

// Helper functions for background sync
async function syncPins() {
  try {
    const offlinePins = await getOfflineData("pins")
    if (offlinePins.length > 0) {
      // Sync pins with server when online
      console.log("Syncing pins:", offlinePins)
      // Implementation would depend on your backend API
    }
  } catch (error) {
    console.error("Error syncing pins:", error)
  }
}

async function syncFollowUps() {
  try {
    const offlineFollowUps = await getOfflineData("followups")
    if (offlineFollowUps.length > 0) {
      // Sync follow-ups with server when online
      console.log("Syncing follow-ups:", offlineFollowUps)
      // Implementation would depend on your backend API
    }
  } catch (error) {
    console.error("Error syncing follow-ups:", error)
  }
}

async function getOfflineData(type) {
  // Get data from IndexedDB or localStorage
  return []
}
