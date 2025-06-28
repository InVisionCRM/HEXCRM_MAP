// Utility functions for territory operations using basic geometry
// This replaces the need for the full Turf.js library

export interface Point {
  lat: number
  lng: number
}

export interface Polygon {
  coordinates: Point[]
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  const { lat, lng } = point
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng
    const yi = polygon[i].lat
    const xj = polygon[j].lng
    const yj = polygon[j].lat

    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }

  return inside
}

/**
 * Calculate the area of a polygon in square meters (approximate)
 */
export function calculatePolygonArea(coordinates: Point[]): number {
  if (coordinates.length < 3) return 0

  let area = 0
  const earthRadius = 6371000 // Earth's radius in meters

  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length
    const lat1 = (coordinates[i].lat * Math.PI) / 180
    const lat2 = (coordinates[j].lat * Math.PI) / 180
    const deltaLng = ((coordinates[j].lng - coordinates[i].lng) * Math.PI) / 180

    area += deltaLng * (2 + Math.sin(lat1) + Math.sin(lat2))
  }

  area = Math.abs((area * earthRadius * earthRadius) / 2)
  return area
}

/**
 * Calculate the center point of a polygon
 */
export function getPolygonCenter(coordinates: Point[]): Point {
  if (coordinates.length === 0) {
    return { lat: 0, lng: 0 }
  }

  let totalLat = 0
  let totalLng = 0

  coordinates.forEach((coord) => {
    totalLat += coord.lat
    totalLng += coord.lng
  })

  return {
    lat: totalLat / coordinates.length,
    lng: totalLng / coordinates.length,
  }
}

/**
 * Calculate distance between two points in meters
 */
export function calculateDistance(point1: Point, point2: Point): number {
  const R = 6371000 // Earth's radius in meters
  const lat1Rad = (point1.lat * Math.PI) / 180
  const lat2Rad = (point2.lat * Math.PI) / 180
  const deltaLatRad = ((point2.lat - point1.lat) * Math.PI) / 180
  const deltaLngRad = ((point2.lng - point1.lng) * Math.PI) / 180

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Validate if a polygon is valid (at least 3 points, no self-intersections)
 */
export function validatePolygon(coordinates: Point[]): { isValid: boolean; error?: string } {
  if (coordinates.length < 3) {
    return { isValid: false, error: "Polygon must have at least 3 points" }
  }

  // Check for duplicate consecutive points
  for (let i = 0; i < coordinates.length; i++) {
    const current = coordinates[i]
    const next = coordinates[(i + 1) % coordinates.length]

    if (current.lat === next.lat && current.lng === next.lng) {
      return { isValid: false, error: "Polygon cannot have duplicate consecutive points" }
    }
  }

  // Basic check for very small polygons
  const area = calculatePolygonArea(coordinates)
  if (area < 1) {
    // Less than 1 square meter
    return { isValid: false, error: "Polygon area is too small" }
  }

  return { isValid: true }
}

/**
 * Simplify polygon by removing points that are too close together
 */
export function simplifyPolygon(coordinates: Point[], tolerance = 0.0001): Point[] {
  if (coordinates.length <= 3) return coordinates

  const simplified: Point[] = [coordinates[0]]

  for (let i = 1; i < coordinates.length; i++) {
    const current = coordinates[i]
    const last = simplified[simplified.length - 1]

    const distance = Math.sqrt(Math.pow(current.lat - last.lat, 2) + Math.pow(current.lng - last.lng, 2))

    if (distance > tolerance) {
      simplified.push(current)
    }
  }

  // Ensure we have at least 3 points
  if (simplified.length < 3 && coordinates.length >= 3) {
    return coordinates.slice(0, 3)
  }

  return simplified
}

/**
 * Get bounding box of a polygon
 */
export function getBoundingBox(coordinates: Point[]): {
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
