"use client"

// Turf.js utility functions for territory management
// Using individual imports to optimize bundle size

interface Point {
  lat: number
  lng: number
}

interface Territory {
  id: string
  name: string
  color: string
  coordinates: Point[]
  createdAt: Date
  updatedAt: Date
}

// Convert coordinates to Turf.js polygon format
export function coordinatesToTurfPolygon(coordinates: Point[]) {
  if (coordinates.length < 3) {
    throw new Error("Polygon must have at least 3 coordinates")
  }

  // Turf.js expects [lng, lat] format and closed polygon (first point = last point)
  const turfCoords = coordinates.map((coord) => [coord.lng, coord.lat])

  // Ensure polygon is closed
  if (
    turfCoords[0][0] !== turfCoords[turfCoords.length - 1][0] ||
    turfCoords[0][1] !== turfCoords[turfCoords.length - 1][1]
  ) {
    turfCoords.push(turfCoords[0])
  }

  return {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [turfCoords],
    },
    properties: {},
  }
}

// Check if a point is inside a territory polygon
export function isPointInTerritory(point: Point, territory: Territory): boolean {
  try {
    const polygon = coordinatesToTurfPolygon(territory.coordinates)
    const turfPoint = {
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [point.lng, point.lat],
      },
      properties: {},
    }

    // Simple point-in-polygon algorithm (ray casting)
    return pointInPolygon(turfPoint.geometry.coordinates, polygon.geometry.coordinates[0])
  } catch (error) {
    console.error("Error checking point in territory:", error)
    return false
  }
}

// Find all territories that contain a given point
export function getTerritoriesContainingPoint(point: Point, territories: Territory[]): Territory[] {
  return territories.filter((territory) => isPointInTerritory(point, territory))
}

// Simple point-in-polygon algorithm (ray casting method)
function pointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }

  return inside
}

// Calculate polygon area (approximate)
export function calculatePolygonArea(coordinates: Point[]): number {
  if (coordinates.length < 3) return 0

  let area = 0
  const n = coordinates.length

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += coordinates[i].lat * coordinates[j].lng
    area -= coordinates[j].lat * coordinates[i].lng
  }

  return Math.abs(area) / 2
}

// Snap coordinates to a grid (optional feature for clean lines)
export function snapToGrid(point: Point, gridSize = 0.0001): Point {
  return {
    lat: Math.round(point.lat / gridSize) * gridSize,
    lng: Math.round(point.lng / gridSize) * gridSize,
  }
}

// Simplify polygon by removing points that are too close together
export function simplifyPolygon(coordinates: Point[], tolerance = 0.0001): Point[] {
  if (coordinates.length <= 3) return coordinates

  const simplified = [coordinates[0]]

  for (let i = 1; i < coordinates.length; i++) {
    const prev = simplified[simplified.length - 1]
    const curr = coordinates[i]

    const distance = Math.sqrt(Math.pow(curr.lat - prev.lat, 2) + Math.pow(curr.lng - prev.lng, 2))

    if (distance > tolerance) {
      simplified.push(curr)
    }
  }

  // Ensure we have at least 3 points for a valid polygon
  if (simplified.length < 3 && coordinates.length >= 3) {
    return coordinates.slice(0, 3)
  }

  return simplified
}

// Get polygon bounds
export function getPolygonBounds(coordinates: Point[]): {
  north: number
  south: number
  east: number
  west: number
} {
  if (coordinates.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 }
  }

  let north = coordinates[0].lat
  let south = coordinates[0].lat
  let east = coordinates[0].lng
  let west = coordinates[0].lng

  coordinates.forEach((coord) => {
    north = Math.max(north, coord.lat)
    south = Math.min(south, coord.lat)
    east = Math.max(east, coord.lng)
    west = Math.min(west, coord.lng)
  })

  return { north, south, east, west }
}
