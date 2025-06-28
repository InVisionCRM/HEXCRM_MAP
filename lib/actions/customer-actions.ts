'use server'

import { customerDb } from '../database'
import type { Customer } from '../types'

export async function createCustomer(data: {
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
}): Promise<Customer> {
  try {
    return await customerDb.create(data)
  } catch (error) {
    console.error('Error creating customer:', error)
    throw new Error('Failed to create customer')
  }
}

export async function getAllCustomers(): Promise<Customer[]> {
  try {
    return await customerDb.findAll()
  } catch (error) {
    console.error('Error fetching customers:', error)
    throw new Error('Failed to fetch customers')
  }
}

export async function getCustomer(id: string): Promise<Customer | null> {
  try {
    return await customerDb.findById(id)
  } catch (error) {
    console.error('Error fetching customer:', error)
    throw new Error('Failed to fetch customer')
  }
}

export async function getCustomerByPinId(pinId: string): Promise<Customer | null> {
  try {
    return await customerDb.findByPinId(pinId)
  } catch (error) {
    console.error('Error fetching customer by pin ID:', error)
    throw new Error('Failed to fetch customer by pin ID')
  }
}

export async function updateCustomer(customer: Customer): Promise<Customer> {
  try {
    return await customerDb.update(customer.id, {
      pinId: customer.pinId,
      firstName: customer.firstName,
      phone: customer.phone,
      email: customer.email,
      ownsCrypto: customer.ownsCrypto,
      socials: customer.socials,
      notes: customer.notes,
      address: customer.address,
    })
  } catch (error) {
    console.error('Error updating customer:', error)
    throw new Error('Failed to update customer')
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  try {
    await customerDb.delete(id)
  } catch (error) {
    console.error('Error deleting customer:', error)
    throw new Error('Failed to delete customer')
  }
}

export async function deleteCustomerByPinId(pinId: string): Promise<void> {
  try {
    await customerDb.deleteByPinId(pinId)
  } catch (error) {
    console.error('Error deleting customer by pin ID:', error)
    throw new Error('Failed to delete customer by pin ID')
  }
}

export async function saveCustomer(customer: Customer): Promise<void> {
  try {
    await customerDb.upsert(customer)
  } catch (error) {
    console.error('Error saving customer:', error)
    throw new Error('Failed to save customer')
  }
}

// Helper function to save customer by pin ID (useful for onboarding)
export async function saveCustomerByPinId(customer: Customer): Promise<Customer> {
  try {
    return await customerDb.upsertByPinId(customer)
  } catch (error) {
    console.error('Error saving customer by pin ID:', error)
    throw new Error('Failed to save customer by pin ID')
  }
} 