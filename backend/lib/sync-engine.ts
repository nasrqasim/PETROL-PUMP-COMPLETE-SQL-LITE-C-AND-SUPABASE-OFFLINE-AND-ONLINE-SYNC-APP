"use client";

import { useState, useEffect, useCallback } from "react";
import { offlineDb, StoreName } from "./offline-db";

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  syncNow: () => Promise<void>;
  saveOfflineFirst: <T extends Record<string, any>>(
    store: StoreName,
    item: T,
    endpoint: string,
    method?: "POST" | "PUT" | "DELETE"
  ) => Promise<T>;
}

export function useSyncEngine(): SyncStatus {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const refreshPendingCount = useCallback(async () => {
    try {
      const pending = await offlineDb.getPendingSync();
      setPendingCount(pending.length);
    } catch {
      // Ignore
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.onLine) {
      refreshPendingCount();
      return;
    }

    setIsSyncing(true);
    try {
      // 1. Process pending offline sync queue
      const queue = await offlineDb.getPendingSync();
      for (const item of queue) {
        try {
          const res = await fetch(item.endpoint, {
            method: item.method || "POST",
            headers: { "Content-Type": "application/json" },
            body: item.payload ? JSON.stringify(item.payload) : undefined,
          });
          if (res.ok) {
            await offlineDb.removeSyncItem(item.syncId);
          }
        } catch (postErr) {
          console.warn("[SyncEngine] Failed to upload queued item:", postErr);
        }
      }

      // 2. Prime local cache by pulling core collections from server
      const pullEndpoints: { store: StoreName; url: string; extract: (d: any) => any[] }[] = [
        { store: "customers", url: "/api/customers", extract: (d) => d.customers || d || [] },
        { store: "suppliers", url: "/api/suppliers", extract: (d) => d.suppliers || d || [] },
        { store: "gariyan", url: "/api/gariyan", extract: (d) => d.gariyan || d || [] },
        { store: "staff", url: "/api/staff", extract: (d) => d.staff || d || [] },
        { store: "locations", url: "/api/locations", extract: (d) => d.locations || d || [] },
        { store: "products", url: "/api/products", extract: (d) => d.products || d || [] },
        { store: "roznamcha", url: "/api/roznamcha", extract: (d) => d.entries || d.roznamcha || d || [] },
        { store: "vouchers", url: "/api/vouchers", extract: (d) => d.vouchers || d || [] },
        { store: "bankAccounts", url: "/api/bank-accounts", extract: (d) => d.accounts || d.bankAccounts || d || [] },
      ];

      for (const p of pullEndpoints) {
        try {
          const res = await fetch(p.url);
          if (res.ok) {
            const data = await res.json();
            const list = p.extract(data);
            if (Array.isArray(list)) {
              await offlineDb.replaceAll(p.store, list);
            }
          }
        } catch {
          // Keep local cache untouched if network read fails
        }
      }

      setLastSyncTime(new Date().toLocaleTimeString("en-GB"));
    } finally {
      setIsSyncing(false);
      refreshPendingCount();
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshPendingCount();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial cache pull if online
    if (navigator.onLine) {
      syncNow();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncNow, refreshPendingCount]);

  /**
   * Save a record offline-first into IndexedDB immediately,
   * then attempt online transmission or enqueue for sync.
   */
  const saveOfflineFirst = useCallback(
    async <T extends Record<string, any>>(
      store: StoreName,
      item: T,
      endpoint: string,
      method: "POST" | "PUT" | "DELETE" = "POST"
    ): Promise<T> => {
      // 1. Immediately persist locally in IndexedDB
      await offlineDb.put(store, item);

      // 2. If online, attempt direct transmission
      if (typeof window !== "undefined" && navigator.onLine) {
        try {
          const res = await fetch(endpoint, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          });
          if (res.ok) {
            const resultData = await res.json();
            const confirmed = resultData.data || resultData || item;
            await offlineDb.put(store, confirmed);
            return confirmed;
          }
        } catch (err) {
          console.warn("[saveOfflineFirst] Direct sync failed, enqueuing:", err);
        }
      }

      // 3. If offline or direct fetch threw, enqueue into syncQueue
      await offlineDb.enqueueSync({
        endpoint,
        method,
        payload: item,
        store,
        recordId: (item.Id || item.id) as string | number | undefined,
      });

      refreshPendingCount();
      return item;
    },
    [refreshPendingCount]
  );

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncNow,
    saveOfflineFirst,
  };
}
