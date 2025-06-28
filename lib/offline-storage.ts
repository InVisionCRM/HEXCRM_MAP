"use client"

// IndexedDB wrapper for offline storage
class OfflineStorage {
  private dbName = "PulseChainEducationTracker"
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
          pinStore.createIndex("timestamp", "timestamp", { unique: false })
          pinStore.createIndex("status", "status", { unique: false })
        }

        if (!db.objectStoreNames.contains("followUps")) {
          const followUpStore = db.createObjectStore("followUps", { keyPath: "id" })
          followUpStore.createIndex("pinId", "pinId", { unique: false })
          followUpStore.createIndex("date", "date", { unique: false })
          followUpStore.createIndex("status", "status", { unique: false })
        }

        if (!db.objectStoreNames.contains("territories")) {
          db.createObjectStore("territories", { keyPath: "id" })
        }

        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" })
        }
      }
    })
  }

  async savePin(pin: any): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["pins"], "readwrite")
      const store = transaction.objectStore("pins")
      const request = store.put(pin)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getPins(): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["pins"], "readonly")
      const store = transaction.objectStore("pins")
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async saveFollowUp(followUp: any): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["followUps"], "readwrite")
      const store = transaction.objectStore("followUps")
      const request = store.put(followUp)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getFollowUps(): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["followUps"], "readonly")
      const store = transaction.objectStore("followUps")
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["settings"], "readwrite")
      const store = transaction.objectStore("settings")
      const request = store.put({ key, value })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getSetting(key: string): Promise<any> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["settings"], "readonly")
      const store = transaction.objectStore("settings")
      const request = store.get(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result?.value)
    })
  }
}

export const offlineStorage = new OfflineStorage()
