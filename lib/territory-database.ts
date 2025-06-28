"use client"

import * as territoryActions from './actions/territory-actions'
import type { Territory, Coordinate } from './types'

/**
 * PostgreSQL-based territory storage using server actions
 * This replaces the IndexedDB storage with a proper database
 * while maintaining the same interface
 */
export class TerritoryDatabase {
  async init(): Promise<void> {
    // No initialization needed for server actions
    return Promise.resolve()
  }

  async saveTerritory(territory: Territory): Promise<void> {
    try {
      await territoryActions.saveTerritory(territory)
    } catch (error) {
      console.error('Error saving territory:', error)
      throw error
    }
  }

  async getTerritories(): Promise<Territory[]> {
    try {
      return await territoryActions.getAllTerritories()
    } catch (error) {
      console.error('Error loading territories:', error)
      throw error
    }
  }

  async getTerritory(id: string): Promise<Territory | null> {
    try {
      return await territoryActions.getTerritory(id)
    } catch (error) {
      console.error('Error loading territory:', error)
      throw error
    }
  }

  async updateTerritory(territory: Territory): Promise<void> {
    try {
      await territoryActions.updateTerritory(territory)
    } catch (error) {
      console.error('Error updating territory:', error)
      throw error
    }
  }

  async deleteTerritory(id: string): Promise<void> {
    try {
      await territoryActions.deleteTerritory(id)
    } catch (error) {
      console.error('Error deleting territory:', error)
      throw error
    }
  }

  async clearTerritories(): Promise<void> {
    try {
      const territories = await this.getTerritories()
      await Promise.all(territories.map(t => this.deleteTerritory(t.id)))
    } catch (error) {
      console.error('Error clearing territories:', error)
      throw error
    }
  }
}

// Create a singleton instance that matches the IndexedDB interface
export const territoryDatabase = new TerritoryDatabase()

// For backward compatibility, export with the same name as IndexedDB version
export const territoryStorage = territoryDatabase

// Re-export types for compatibility
export type { Territory, Coordinate } 