"use client"

export interface Territory {
  id: string
  name: string
  color: string
  coordinates: Array<{ lat: number; lng: number }>
  createdAt: Date
  updatedAt: Date
}

class TerritoryStorage {
  private dbName = "TerritoryDB"
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
        if (!db.objectStoreNames.contains("territories")) {
          db.createObjectStore("territories", { keyPath: "id" })
        }
      }
    })
  }

  async saveTerritory(territory: Territory): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["territories"], "readwrite")
      const store = transaction.objectStore("territories")
      const request = store.put({
        ...territory,
        createdAt: territory.createdAt.toISOString(),
        updatedAt: territory.updatedAt.toISOString(),
      })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getTerritories(): Promise<Territory[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["territories"], "readonly")
      const store = transaction.objectStore("territories")
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const territories = request.result.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
        }))
        resolve(territories)
      }
    })
  }

  async deleteTerritory(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["territories"], "readwrite")
      const store = transaction.objectStore("territories")
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async updateTerritory(id: string, updates: Partial<Territory>): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["territories"], "readwrite")
      const store = transaction.objectStore("territories")

      const getRequest = store.get(id)
      getRequest.onsuccess = () => {
        const territory = getRequest.result
        if (territory) {
          const updatedTerritory = {
            ...territory,
            ...updates,
            updatedAt: new Date().toISOString(),
          }

          const putRequest = store.put(updatedTerritory)
          putRequest.onerror = () => reject(putRequest.error)
          putRequest.onsuccess = () => resolve()
        } else {
          reject(new Error("Territory not found"))
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }
}

export const territoryStorage = new TerritoryStorage()
