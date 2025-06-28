// Shared types for territory and follow-up management

export interface Coordinate {
  lat: number
  lng: number
}

export interface Territory {
  id: string
  name: string
  color: string
  coordinates: Coordinate[]
  createdAt: Date
  updatedAt: Date
}

export interface Pin {
  id: string
  lat: number
  lng: number
  address: string
  placeId?: string
  propertyName?: string
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface Customer {
  id: string
  pinId: string
  firstName: string
  phone?: string
  email?: string
  ownsCrypto?: boolean
  socials?: {
    twitter?: string
    telegram?: string
    reddit?: string
  }
  notes?: string
  address: string
  createdAt: Date
  updatedAt: Date
}

export interface FollowUp {
  id: string
  pinId: string
  address: string
  propertyName?: string
  date: string
  time: string
  notes?: string
  status?: string
  createdAt: Date
  updatedAt: Date
}

// Legacy interface for backward compatibility with follow-up-modal
export interface FollowUpData extends FollowUp {
  timestamp: Date // Maps to createdAt
} 