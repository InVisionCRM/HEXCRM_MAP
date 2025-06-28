'use server'

import { followUpDb } from '../database'
import type { FollowUp, FollowUpData } from '../types'

export async function createFollowUp(data: {
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
    return await followUpDb.create({
      ...data,
      status: data.status || 'scheduled',
    })
  } catch (error) {
    console.error('Error creating follow-up:', error)
    throw new Error('Failed to create follow-up')
  }
}

export async function getAllFollowUps(): Promise<FollowUp[]> {
  try {
    return await followUpDb.findAll()
  } catch (error) {
    console.error('Error fetching follow-ups:', error)
    throw new Error('Failed to fetch follow-ups')
  }
}

export async function getFollowUp(id: string): Promise<FollowUp | null> {
  try {
    return await followUpDb.findById(id)
  } catch (error) {
    console.error('Error fetching follow-up:', error)
    throw new Error('Failed to fetch follow-up')
  }
}

export async function getFollowUpsByPin(pinId: string): Promise<FollowUp[]> {
  try {
    return await followUpDb.findByPinId(pinId)
  } catch (error) {
    console.error('Error fetching follow-ups for pin:', error)
    throw new Error('Failed to fetch follow-ups for pin')
  }
}

export async function getFollowUpsByDateRange(startDate: string, endDate: string): Promise<FollowUp[]> {
  try {
    return await followUpDb.findByDateRange(startDate, endDate)
  } catch (error) {
    console.error('Error fetching follow-ups by date range:', error)
    throw new Error('Failed to fetch follow-ups by date range')
  }
}

export async function updateFollowUp(followUp: FollowUp): Promise<FollowUp> {
  try {
    return await followUpDb.update(followUp.id, {
      pinId: followUp.pinId,
      address: followUp.address,
      propertyName: followUp.propertyName,
      date: followUp.date,
      time: followUp.time,
      notes: followUp.notes,
      status: followUp.status,
    })
  } catch (error) {
    console.error('Error updating follow-up:', error)
    throw new Error('Failed to update follow-up')
  }
}

export async function deleteFollowUp(id: string): Promise<void> {
  try {
    await followUpDb.delete(id)
  } catch (error) {
    console.error('Error deleting follow-up:', error)
    throw new Error('Failed to delete follow-up')
  }
}

export async function saveFollowUp(followUp: FollowUp): Promise<void> {
  try {
    await followUpDb.upsert(followUp)
  } catch (error) {
    console.error('Error saving follow-up:', error)
    throw new Error('Failed to save follow-up')
  }
}

// Helper function to convert FollowUpData (from modal) to FollowUp
export async function saveFollowUpData(data: FollowUpData): Promise<FollowUp> {
  try {
    return await followUpDb.upsert({
      id: data.id,
      pinId: data.pinId,
      address: data.address,
      propertyName: data.propertyName,
      date: data.date,
      time: data.time,
      notes: data.notes,
      status: data.status || 'scheduled',
      createdAt: data.timestamp || new Date(),
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error('Error saving follow-up data:', error)
    throw new Error('Failed to save follow-up data')
  }
} 