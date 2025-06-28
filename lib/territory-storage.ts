"use client"

interface Territory {
  id: string
  name: string
  color: string
  coordinates: Array<{ lat: number; lng: number }>
  createdAt: Date
  updatedAt: Date
}

class TerritoryStorage {
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

        // Create territories store if it doesn't exist
        if (!db.objectStoreNames.contains("territories")) {
          const territoryStore = db.createObjectStore("territories", { keyPath: "id" })
          territoryStore.createIndex("name", "name", { unique: false })
          territoryStore.createIndex("createdAt", "createdAt", { unique: false })
        }
      }
    })
  }

  async saveTerritory(territory: Territory): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["territories"], "readwrite")
    const store = transaction.objectStore("territories")
    await store.put(territory)
  }

  async getTerritories(): Promise<Territory[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["territories"], "readonly")
      const store = transaction.objectStore("territories")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteTerritory(id: string): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["territories"], "readwrite")
    const store = transaction.objectStore("territories")
    await store.delete(id)
  }

  async updateTerritory(territory: Territory): Promise<void> {
    if (!this.db) await this.init()

    const updatedTerritory = {
      ...territory,
      updatedAt: new Date(),
    }

    const transaction = this.db!.transaction(["territories"], "readwrite")
    const store = transaction.objectStore("territories")
    await store.put(updatedTerritory)
  }
}

export const territoryStorage = new TerritoryStorage()
export type { Territory }
