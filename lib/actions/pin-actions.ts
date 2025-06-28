'use server'

import { pinDb } from '../database'
import type { Pin } from '../types'

export async function createPin(data: {
  id: string
  lat: number
  lng: number
  address: string
  placeId?: string
  propertyName?: string
  status?: string
}): Promise<Pin> {
  try {
    return await pinDb.create({
      ...data,
      status: data.status || 'new',
    })
  } catch (error) {
    console.error('Error creating pin:', error)
    throw new Error('Failed to create pin')
  }
}

export async function getAllPins(): Promise<Pin[]> {
  try {
    return await pinDb.findAll()
  } catch (error) {
    console.error('Error fetching pins:', error)
    throw new Error('Failed to fetch pins')
  }
}

export async function getPin(id: string): Promise<Pin | null> {
  try {
    return await pinDb.findById(id)
  } catch (error) {
    console.error('Error fetching pin:', error)
    throw new Error('Failed to fetch pin')
  }
}

export async function updatePin(pin: Pin): Promise<Pin> {
  try {
    return await pinDb.update(pin.id, {
      lat: pin.lat,
      lng: pin.lng,
      address: pin.address,
      placeId: pin.placeId,
      propertyName: pin.propertyName,
      status: pin.status,
    })
  } catch (error) {
    console.error('Error updating pin:', error)
    throw new Error('Failed to update pin')
  }
}

export async function deletePin(id: string): Promise<void> {
  try {
    await pinDb.delete(id)
  } catch (error) {
    console.error('Error deleting pin:', error)
    throw new Error('Failed to delete pin')
  }
}

export async function savePin(pin: Pin): Promise<void> {
  try {
    await pinDb.upsert(pin)
  } catch (error) {
    console.error('Error saving pin:', error)
    throw new Error('Failed to save pin')
  }
}

export async function updatePinStatus(id: string, status: string): Promise<Pin> {
  try {
    return await pinDb.update(id, { status })
  } catch (error) {
    console.error('Error updating pin status:', error)
    throw new Error('Failed to update pin status')
  }
} 