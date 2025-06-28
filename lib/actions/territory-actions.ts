'use server'

import { territoryDb } from '../database'
import type { Territory, Coordinate } from '../types'

export async function createTerritory(data: {
  id: string
  name: string
  color: string
  coordinates: Coordinate[]
}): Promise<Territory> {
  try {
    return await territoryDb.upsert({
      id: data.id,
      name: data.name,
      color: data.color,
      coordinates: data.coordinates,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error('Error creating territory:', error)
    throw new Error('Failed to create territory')
  }
}

export async function getAllTerritories(): Promise<Territory[]> {
  try {
    return await territoryDb.findAll()
  } catch (error) {
    console.error('Error fetching territories:', error)
    throw new Error('Failed to fetch territories')
  }
}

export async function getTerritory(id: string): Promise<Territory | null> {
  try {
    return await territoryDb.findById(id)
  } catch (error) {
    console.error('Error fetching territory:', error)
    throw new Error('Failed to fetch territory')
  }
}

export async function updateTerritory(territory: Territory): Promise<Territory> {
  try {
    return await territoryDb.update(territory.id, {
      name: territory.name,
      color: territory.color,
      coordinates: territory.coordinates,
    })
  } catch (error) {
    console.error('Error updating territory:', error)
    throw new Error('Failed to update territory')
  }
}

export async function deleteTerritory(id: string): Promise<void> {
  try {
    await territoryDb.delete(id)
  } catch (error) {
    console.error('Error deleting territory:', error)
    throw new Error('Failed to delete territory')
  }
}

export async function saveTerritory(territory: Territory): Promise<void> {
  try {
    await territoryDb.upsert(territory)
  } catch (error) {
    console.error('Error saving territory:', error)
    throw new Error('Failed to save territory')
  }
} 