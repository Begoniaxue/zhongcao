import { DB_NAME, DB_VERSION, STORE_NAME } from './constants'
import type { IndexedDBFileRecord } from './types'

class IndexedDBManager {
  private dbPromise: Promise<IDBDatabase> | null = null

  async initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'fileHash'
          })
          store.createIndex('lastModified', 'lastModified')
        }
      }
    })

    return this.dbPromise
  }

  async saveProgress(record: IndexedDBFileRecord): Promise<void> {
    const db = await this.initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put({
        ...record,
        lastModified: Date.now()
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getProgress(fileHash: string): Promise<IndexedDBFileRecord | null> {
    const db = await this.initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(fileHash)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteProgress(fileHash: string): Promise<void> {
    const db = await this.initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(fileHash)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clearExpired(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    const db = await this.initDB()
    const cutoffTime = Date.now() - maxAge

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('lastModified')
      const request = index.openCursor()

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          if ((cursor.value as IndexedDBFileRecord).lastModified < cutoffTime) {
            cursor.delete()
          }
          cursor.continue()
        } else {
          resolve()
        }
      }

      request.onerror = () => reject(request.error)
    })
  }
}

export const indexedDBManager = new IndexedDBManager()
