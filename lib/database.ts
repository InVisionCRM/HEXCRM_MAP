import { PrismaClient } from '@prisma/client'
import type { Territory, Coordinate, Pin, Customer, FollowUp, FollowUpData } from './types'

// Global variable to store the Prisma client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create a single instance of Prisma Client
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Re-export types for convenience
export type { Territory, Coordinate, Pin, FollowUp, FollowUpData }

// Utility functions to convert between Prisma and your app types
export function territoryFromPrisma(territory: any): Territory {
  return {
    id: territory.id,
    name: territory.name,
    color: territory.color,
    coordinates: territory.coordinates as Coordinate[],
    createdAt: territory.createdAt,
    updatedAt: territory.updatedAt,
  }
}

export function territoryToPrisma(territory: Omit<Territory, 'id' | 'createdAt' | 'updatedAt'>) {
  return {
    name: territory.name,
    color: territory.color,
    coordinates: territory.coordinates,
  }
}

export function pinFromPrisma(pin: any): Pin {
  return {
    id: pin.id,
    lat: pin.lat,
    lng: pin.lng,
    address: pin.address,
    placeId: pin.placeId,
    propertyName: pin.propertyName,
    status: pin.status,
    createdAt: pin.createdAt,
    updatedAt: pin.updatedAt,
  }
}

export function followUpFromPrisma(followUp: any): FollowUp {
  return {
    id: followUp.id,
    pinId: followUp.pinId,
    address: followUp.address,
    propertyName: followUp.propertyName,
    date: followUp.date,
    time: followUp.time,
    notes: followUp.notes,
    status: followUp.status,
    createdAt: followUp.createdAt,
    updatedAt: followUp.updatedAt,
  }
}

export function pinToPrisma(pin: Omit<Pin, 'id' | 'createdAt' | 'updatedAt'>) {
  return {
    lat: pin.lat,
    lng: pin.lng,
    address: pin.address,
    placeId: pin.placeId,
    propertyName: pin.propertyName,
    status: pin.status,
  }
}

export function customerFromPrisma(customer: any): Customer {
  return {
    id: customer.id,
    pinId: customer.pinId,
    firstName: customer.firstName,
    phone: customer.phone,
    email: customer.email,
    ownsCrypto: customer.ownsCrypto,
    socials: customer.socials as Customer['socials'],
    notes: customer.notes,
    address: customer.address,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  }
}

export function customerToPrisma(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) {
  return {
    pinId: customer.pinId,
    firstName: customer.firstName,
    phone: customer.phone,
    email: customer.email,
    ownsCrypto: customer.ownsCrypto,
    socials: customer.socials,
    notes: customer.notes,
    address: customer.address,
  }
}

export function followUpToPrisma(followUp: Omit<FollowUp, 'id' | 'createdAt' | 'updatedAt'>) {
  return {
    pinId: followUp.pinId,
    address: followUp.address,
    propertyName: followUp.propertyName,
    date: followUp.date,
    time: followUp.time,
    notes: followUp.notes,
    status: followUp.status,
  }
}

// Database operations for territories
export class TerritoryDatabase {
  async create(data: { name: string; color: string; coordinates: Coordinate[] }): Promise<Territory> {
    const territory = await prisma.territory.create({
      data: territoryToPrisma(data),
    })
    return territoryFromPrisma(territory)
  }

  async findAll(): Promise<Territory[]> {
    const territories = await prisma.territory.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return territories.map(territoryFromPrisma)
  }

  async findById(id: string): Promise<Territory | null> {
    const territory = await prisma.territory.findUnique({
      where: { id },
    })
    return territory ? territoryFromPrisma(territory) : null
  }

  async update(id: string, data: Partial<{ name: string; color: string; coordinates: Coordinate[] }>): Promise<Territory> {
    const territory = await prisma.territory.update({
      where: { id },
      data,
    })
    return territoryFromPrisma(territory)
  }

  async delete(id: string): Promise<void> {
    await prisma.territory.delete({
      where: { id },
    })
  }

  async upsert(territory: Territory): Promise<Territory> {
    const result = await prisma.territory.upsert({
      where: { id: territory.id },
      update: {
        name: territory.name,
        color: territory.color,
        coordinates: territory.coordinates,
      },
      create: {
        id: territory.id,
        name: territory.name,
        color: territory.color,
        coordinates: territory.coordinates,
      },
    })
    return territoryFromPrisma(result)
  }
}

// Database operations for pins
export class PinDatabase {
  async create(data: Omit<Pin, 'createdAt' | 'updatedAt'>): Promise<Pin> {
    const pin = await prisma.pin.create({
      data: {
        id: data.id,
        ...pinToPrisma(data),
      },
    })
    return pinFromPrisma(pin)
  }

  async findAll(): Promise<Pin[]> {
    const pins = await prisma.pin.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return pins.map(pinFromPrisma)
  }

  async findById(id: string): Promise<Pin | null> {
    const pin = await prisma.pin.findUnique({
      where: { id },
    })
    return pin ? pinFromPrisma(pin) : null
  }

  async update(id: string, data: Partial<Omit<Pin, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Pin> {
    const pin = await prisma.pin.update({
      where: { id },
      data,
    })
    return pinFromPrisma(pin)
  }

  async delete(id: string): Promise<void> {
    await prisma.pin.delete({
      where: { id },
    })
  }

  async upsert(pin: Pin): Promise<Pin> {
    const result = await prisma.pin.upsert({
      where: { id: pin.id },
      update: pinToPrisma(pin),
      create: {
        id: pin.id,
        ...pinToPrisma(pin),
      },
    })
    return pinFromPrisma(result)
  }
}

// Database operations for customers
export class CustomerDatabase {
  async create(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const customer = await prisma.customer.create({
      data: customerToPrisma(data),
    })
    return customerFromPrisma(customer)
  }

  async findAll(): Promise<Customer[]> {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return customers.map(customerFromPrisma)
  }

  async findById(id: string): Promise<Customer | null> {
    const customer = await prisma.customer.findUnique({
      where: { id },
    })
    return customer ? customerFromPrisma(customer) : null
  }

  async findByPinId(pinId: string): Promise<Customer | null> {
    const customer = await prisma.customer.findUnique({
      where: { pinId },
    })
    return customer ? customerFromPrisma(customer) : null
  }

  async update(id: string, data: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Customer> {
    const customer = await prisma.customer.update({
      where: { id },
      data,
    })
    return customerFromPrisma(customer)
  }

  async delete(id: string): Promise<void> {
    await prisma.customer.delete({
      where: { id },
    })
  }

  async deleteByPinId(pinId: string): Promise<void> {
    await prisma.customer.delete({
      where: { pinId },
    })
  }

  async upsert(customer: Customer): Promise<Customer> {
    const result = await prisma.customer.upsert({
      where: { id: customer.id },
      update: customerToPrisma(customer),
      create: {
        id: customer.id,
        ...customerToPrisma(customer),
      },
    })
    return customerFromPrisma(result)
  }

  async upsertByPinId(customer: Customer): Promise<Customer> {
    const result = await prisma.customer.upsert({
      where: { pinId: customer.pinId },
      update: customerToPrisma(customer),
      create: {
        id: customer.id,
        ...customerToPrisma(customer),
      },
    })
    return customerFromPrisma(result)
  }
}

// Database operations for follow-ups
export class FollowUpDatabase {
  async create(data: Omit<FollowUp, 'id' | 'createdAt' | 'updatedAt'>): Promise<FollowUp> {
    const followUp = await prisma.followUp.create({
      data: followUpToPrisma(data),
    })
    return followUpFromPrisma(followUp)
  }

  async findAll(): Promise<FollowUp[]> {
    const followUps = await prisma.followUp.findMany({
      orderBy: { date: 'asc' },
    })
    return followUps.map(followUpFromPrisma)
  }

  async findById(id: string): Promise<FollowUp | null> {
    const followUp = await prisma.followUp.findUnique({
      where: { id },
    })
    return followUp ? followUpFromPrisma(followUp) : null
  }

  async findByPinId(pinId: string): Promise<FollowUp[]> {
    const followUps = await prisma.followUp.findMany({
      where: { pinId },
      orderBy: { date: 'asc' },
    })
    return followUps.map(followUpFromPrisma)
  }

  async findByDateRange(startDate: string, endDate: string): Promise<FollowUp[]> {
    const followUps = await prisma.followUp.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    })
    return followUps.map(followUpFromPrisma)
  }

  async update(id: string, data: Partial<Omit<FollowUp, 'id' | 'createdAt' | 'updatedAt'>>): Promise<FollowUp> {
    const followUp = await prisma.followUp.update({
      where: { id },
      data,
    })
    return followUpFromPrisma(followUp)
  }

  async delete(id: string): Promise<void> {
    await prisma.followUp.delete({
      where: { id },
    })
  }

  async upsert(followUp: FollowUp): Promise<FollowUp> {
    const result = await prisma.followUp.upsert({
      where: { id: followUp.id },
      update: followUpToPrisma(followUp),
      create: {
        id: followUp.id,
        ...followUpToPrisma(followUp),
      },
    })
    return followUpFromPrisma(result)
  }
}

export const territoryDb = new TerritoryDatabase()
export const pinDb = new PinDatabase()
export const customerDb = new CustomerDatabase()
export const followUpDb = new FollowUpDatabase()

// Export Prisma types for use in other parts of the app
export type { Territory as PrismaTerritory, FollowUp as PrismaFollowUp, Customer as PrismaCustomer, Pin as PrismaPin } from '@prisma/client' 