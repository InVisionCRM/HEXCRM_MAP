"use client"

interface OfflineData {
  pins: any[]
  followUps: any[]
  customers: any[]
  lastSync: number
}

class OfflineStorage {
  private dbName = "pulsechain-tracker"
  private version = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        if (!db.objectStoreNames.contains("pins")) {
          const pinStore = db.createObjectStore("pins", { keyPath: "id" })
          pinStore.createIndex("status", "status", { unique: false })
          pinStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        if (!db.objectStoreNames.contains("followUps")) {
          const followUpStore = db.createObjectStore("followUps", { keyPath: "id" })
          followUpStore.createIndex("date", "date", { unique: false })
          followUpStore.createIndex("pinId", "pinId", { unique: false })
        }

        if (!db.objectStoreNames.contains("customers")) {
          const customerStore = db.createObjectStore("customers", { keyPath: "pinId" })
          customerStore.createIndex("firstName", "firstName", { unique: false })
          customerStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        if (!db.objectStoreNames.contains("sync")) {
          db.createObjectStore("sync", { keyPath: "type" })
        }
      }
    })
  }

  async savePin(pin: any): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["pins"], "readwrite")
    const store = transaction.objectStore("pins")
    await store.put({ ...pin, offline: true })
  }

  async savePins(pins: any[]): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["pins"], "readwrite")
    const store = transaction.objectStore("pins")

    for (const pin of pins) {
      await store.put(pin)
    }
  }

  async getPins(): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["pins"], "readonly")
      const store = transaction.objectStore("pins")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async saveFollowUp(followUp: any): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["followUps"], "readwrite")
    const store = transaction.objectStore("followUps")
    await store.put({ ...followUp, offline: true })
  }

  async getFollowUps(): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["followUps"], "readonly")
      const store = transaction.objectStore("followUps")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async saveCustomer(customer: any): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["customers"], "readwrite")
    const store = transaction.objectStore("customers")
    await store.put({ ...customer, offline: true })
  }

  async getCustomers(): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["customers"], "readonly")
      const store = transaction.objectStore("customers")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getOfflineData(): Promise<{ pins: any[]; followUps: any[]; customers: any[] }> {
    if (!this.db) await this.init()

    const [pins, followUps, customers] = await Promise.all([this.getPins(), this.getFollowUps(), this.getCustomers()])

    return {
      pins: pins.filter((p) => p.offline),
      followUps: followUps.filter((f) => f.offline),
      customers: customers.filter((c) => c.offline),
    }
  }

  async markAsSynced(type: "pins" | "followUps" | "customers", ids: string[]): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction([type], "readwrite")
    const store = transaction.objectStore(type)

    for (const id of ids) {
      const request = store.get(id)
      request.onsuccess = () => {
        const item = request.result
        if (item) {
          delete item.offline
          store.put(item)
        }
      }
    }
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["pins", "followUps", "customers", "sync"], "readwrite")

    await Promise.all([
      transaction.objectStore("pins").clear(),
      transaction.objectStore("followUps").clear(),
      transaction.objectStore("customers").clear(),
      transaction.objectStore("sync").clear(),
    ])
  }
}

export const offlineStorage = new OfflineStorage()
