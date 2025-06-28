import * as customerActions from './actions/customer-actions'
import type { Customer } from './types'

export class CustomerStorage {
  async createCustomer(data: {
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
      return await customerActions.createCustomer(data)
    } catch (error) {
      console.error('Error creating customer:', error)
      throw error
    }
  }

  async getAllCustomers(): Promise<Customer[]> {
    try {
      return await customerActions.getAllCustomers()
    } catch (error) {
      console.error('Error loading customers:', error)
      throw error
    }
  }

  async getCustomer(id: string): Promise<Customer | null> {
    try {
      return await customerActions.getCustomer(id)
    } catch (error) {
      console.error('Error loading customer:', error)
      throw error
    }
  }

  async getCustomerByPinId(pinId: string): Promise<Customer | null> {
    try {
      return await customerActions.getCustomerByPinId(pinId)
    } catch (error) {
      console.error('Error loading customer by pin ID:', error)
      throw error
    }
  }

  async updateCustomer(customer: Customer): Promise<Customer> {
    try {
      return await customerActions.updateCustomer(customer)
    } catch (error) {
      console.error('Error updating customer:', error)
      throw error
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    try {
      await customerActions.deleteCustomer(id)
    } catch (error) {
      console.error('Error deleting customer:', error)
      throw error
    }
  }

  async deleteCustomerByPinId(pinId: string): Promise<void> {
    try {
      await customerActions.deleteCustomerByPinId(pinId)
    } catch (error) {
      console.error('Error deleting customer by pin ID:', error)
      throw error
    }
  }

  async saveCustomer(customer: Customer): Promise<void> {
    try {
      await customerActions.saveCustomer(customer)
    } catch (error) {
      console.error('Error saving customer:', error)
      throw error
    }
  }

  // Helper method for onboarding - converts OnboardData to Customer and saves
  async saveOnboardData(data: {
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
    pinId: string
    address: string
    timestamp?: Date
  }): Promise<Customer> {
    try {
      // First, ensure the pin exists in the database
      const pinActions = await import('./actions/pin-actions')
      let pin = await pinActions.getPin(data.pinId)
      
      if (!pin) {
        // Pin doesn't exist in database, create a basic pin
        // This can happen if the pin was only saved offline
        try {
          pin = await pinActions.createPin({
            id: data.pinId,
            lat: 0, // Default coordinates
            lng: 0,
            address: data.address,
            placeId: '',
            propertyName: '',
            status: 'new',
          })
          console.log('Pin created in database for customer:', pin)
        } catch (pinCreateError) {
          console.error('Failed to create pin in database:', pinCreateError)
          throw new Error('Unable to create pin reference for customer')
        }
      }

      const customer: Customer = {
        id: `customer-${Date.now()}`, // Generate unique ID
        pinId: data.pinId,
        firstName: data.firstName,
        phone: data.phone,
        email: data.email,
        ownsCrypto: data.ownsCrypto || false,
        socials: data.socials,
        notes: data.notes,
        address: data.address,
        createdAt: data.timestamp || new Date(),
        updatedAt: new Date(),
      }

      return await customerActions.saveCustomerByPinId(customer)
    } catch (error) {
      console.error('Error saving onboard data:', error)
      throw error
    }
  }
}

// Create a singleton instance
export const customerStorage = new CustomerStorage() 