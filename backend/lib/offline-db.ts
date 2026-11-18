/**
 * Offline-First IndexedDB Storage Engine for Muslim Construction ERP
 * Provides local persistent offline storage for all 16 collections and sync queue.
 * Operates reliably in PWAs, desktop web browsers, and offline environments.
 */

const DB_NAME = "MuslimConstructionERP_DB";
const DB_VERSION = 1;

export const STORES = [
  "customers",
  "suppliers",
  "gariyan",
  "staff",
  "locations",
  "products",
  "roznamcha",
  "vehicleStatuses",
  "vehicleStatusHistory",
  "cashTransactions",
  "bankAccounts",
  "bankTransactions",
  "vouchers",
  "sales",
  "purchases",
  "expenses",
  "companySettings",
  "auditLogs",
  "syncQueue",
] as const;

export type StoreName = (typeof STORES)[number];

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDb(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB is not supported in this environment"));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create each object store if it doesn't already exist
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          if (store === "syncQueue") {
            db.createObjectStore(store, { keyPath: "syncId", autoIncrement: true });
          } else if (store === "companySettings") {
            db.createObjectStore(store, { keyPath: "key" });
          } else {
            // Check primary key pattern (Id or id)
            db.createObjectStore(store, { keyPath: store === "gariyan" || store === "locations" || store === "roznamcha" || store === "vehicleStatuses" || store === "vehicleStatusHistory" ? "id" : "Id" });
          }
        }
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

export const offlineDb = {
  async getAll<T>(storeName: StoreName): Promise<T[]> {
    try {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as T[]);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn(`[offlineDb] Failed to read ${storeName}:`, err);
      return [];
    }
  },

  async getById<T>(storeName: StoreName, id: number | string): Promise<T | undefined> {
    try {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result as T | undefined);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn(`[offlineDb] Failed to get ${storeName} #${id}:`, err);
      return undefined;
    }
  },

  async put<T extends Record<string, any>>(storeName: StoreName, item: T): Promise<T> {
    try {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.put(item);
        req.onsuccess = () => resolve(item);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.error(`[offlineDb] Failed to put in ${storeName}:`, err);
      return item;
    }
  },

  async bulkPut<T extends Record<string, any>>(storeName: StoreName, items: T[]): Promise<void> {
    if (!items || items.length === 0) return;
    try {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        for (const item of items) {
          store.put(item);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn(`[offlineDb] Bulk put failed for ${storeName}:`, err);
    }
  },

  async delete(storeName: StoreName, id: number | string): Promise<void> {
    try {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.error(`[offlineDb] Failed to delete from ${storeName}:`, err);
    }
  },

  async enqueueSync(entry: {
    endpoint: string;
    method: "POST" | "PUT" | "DELETE";
    payload?: any;
    store: StoreName;
    recordId?: string | number;
  }): Promise<number> {
    try {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("syncQueue", "readwrite");
        const store = tx.objectStore("syncQueue");
        const syncItem = {
          ...entry,
          timestamp: new Date().toISOString(),
          status: "pending",
        };
        const req = store.add(syncItem);
        req.onsuccess = () => resolve(req.result as number);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.error("[offlineDb] Failed to enqueue sync item:", err);
      return -1;
    }
  },

  async getPendingSync(): Promise<any[]> {
    try {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("syncQueue", "readonly");
        const store = tx.objectStore("syncQueue");
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      return [];
    }
  },

  async removeSyncItem(syncId: number): Promise<void> {
    try {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("syncQueue", "readwrite");
        const store = tx.objectStore("syncQueue");
        const req = store.delete(syncId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.error("[offlineDb] Failed to remove sync item:", err);
    }
  },
};
