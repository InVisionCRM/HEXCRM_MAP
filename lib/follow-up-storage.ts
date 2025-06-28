"use client"

import * as followUpActions from './actions/follow-up-actions'
import type { FollowUp, FollowUpData } from './types'

/**
 * PostgreSQL-based follow-up storage using server actions
 * This provides follow-up management functionality with a proper database
 */
export class FollowUpStorage {
  async init(): Promise<void> {
    // No initialization needed for server actions
    return Promise.resolve()
  }

  async saveFollowUp(followUpData: FollowUpData): Promise<FollowUp> {
    try {
      return await followUpActions.saveFollowUpData(followUpData)
    } catch (error) {
      console.error('Error saving follow-up:', error)
      throw error
    }
  }

  async getFollowUps(): Promise<FollowUp[]> {
    try {
      return await followUpActions.getAllFollowUps()
    } catch (error) {
      console.error('Error loading follow-ups:', error)
      throw error
    }
  }

  async getFollowUp(id: string): Promise<FollowUp | null> {
    try {
      return await followUpActions.getFollowUp(id)
    } catch (error) {
      console.error('Error loading follow-up:', error)
      throw error
    }
  }

  async getAllFollowUps(): Promise<FollowUp[]> {
    try {
      return await followUpActions.getAllFollowUps()
    } catch (error) {
      console.error('Error loading all follow-ups:', error)
      throw error
    }
  }

  async getFollowUpsByPin(pinId: string): Promise<FollowUp[]> {
    try {
      return await followUpActions.getFollowUpsByPin(pinId)
    } catch (error) {
      console.error('Error loading follow-ups for pin:', error)
      throw error
    }
  }

  async getFollowUpsByDateRange(startDate: string, endDate: string): Promise<FollowUp[]> {
    try {
      return await followUpActions.getFollowUpsByDateRange(startDate, endDate)
    } catch (error) {
      console.error('Error loading follow-ups by date range:', error)
      throw error
    }
  }

  async updateFollowUp(followUp: FollowUp): Promise<FollowUp> {
    try {
      return await followUpActions.updateFollowUp(followUp)
    } catch (error) {
      console.error('Error updating follow-up:', error)
      throw error
    }
  }

  async deleteFollowUp(id: string): Promise<void> {
    try {
      await followUpActions.deleteFollowUp(id)
    } catch (error) {
      console.error('Error deleting follow-up:', error)
      throw error
    }
  }

  async clearFollowUps(): Promise<void> {
    try {
      const followUps = await this.getFollowUps()
      await Promise.all(followUps.map(f => this.deleteFollowUp(f.id)))
    } catch (error) {
      console.error('Error clearing follow-ups:', error)
      throw error
    }
  }

  // Helper method to create a follow-up directly (without using FollowUpData interface)
  async createFollowUp(data: {
    id: string
    pinId: string
    address: string
    propertyName?: string
    date: string
    time: string
    notes?: string
    status?: string
  }): Promise<FollowUp> {
    try {
      return await followUpActions.createFollowUp(data)
    } catch (error) {
      console.error('Error creating follow-up:', error)
      throw error
    }
  }
}

// Create a singleton instance
export const followUpStorage = new FollowUpStorage()

// Re-export types for compatibility
export type { FollowUp, FollowUpData } 