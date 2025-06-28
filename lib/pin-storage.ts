import * as pinActions from './actions/pin-actions'
import type { Pin } from './types'

export class PinStorage {
  async createPin(data: {
    id: string
    lat: number
    lng: number
    address: string
    placeId?: string
    propertyName?: string
    status?: string
  }): Promise<Pin> {
    try {
      return await pinActions.createPin(data)
    } catch (error) {
      console.error('Error creating pin:', error)
      throw error
    }
  }

  async getAllPins(): Promise<Pin[]> {
    try {
      return await pinActions.getAllPins()
    } catch (error) {
      console.error('Error loading pins:', error)
      throw error
    }
  }

  async getPin(id: string): Promise<Pin | null> {
    try {
      return await pinActions.getPin(id)
    } catch (error) {
      console.error('Error loading pin:', error)
      throw error
    }
  }

  async updatePin(pin: Pin): Promise<Pin> {
    try {
      return await pinActions.updatePin(pin)
    } catch (error) {
      console.error('Error updating pin:', error)
      throw error
    }
  }

  async deletePin(id: string): Promise<void> {
    try {
      await pinActions.deletePin(id)
    } catch (error) {
      console.error('Error deleting pin:', error)
      throw error
    }
  }

  async savePin(pin: Pin): Promise<void> {
    try {
      await pinActions.savePin(pin)
    } catch (error) {
      console.error('Error saving pin:', error)
      throw error
    }
  }

  async updatePinStatus(id: string, status: string): Promise<Pin> {
    try {
      return await pinActions.updatePinStatus(id, status)
    } catch (error) {
      console.error('Error updating pin status:', error)
      throw error
    }
  }
}

// Create a singleton instance
export const pinStorage = new PinStorage() 