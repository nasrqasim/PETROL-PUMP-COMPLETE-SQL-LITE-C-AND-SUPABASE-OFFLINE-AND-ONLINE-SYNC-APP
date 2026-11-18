"use client";

import React from "react";
import { RefreshCw, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { useSyncEngine } from "@/lib/sync-engine";

export default function SyncStatusBadge() {
  const { isOnline, isSyncing, pendingCount, lastSyncTime, syncNow } = useSyncEngine();

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* Status Pill */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
          !isOnline
            ? "bg-rose-50 text-rose-700 border-rose-300"
            : pendingCount > 0
            ? "bg-amber-50 text-amber-700 border-amber-300"
            : "bg-emerald-50 text-emerald-700 border-emerald-300"
        }`}
        title={
          !isOnline
            ? "Offline Mode — Data is safely saved to local IndexedDB"
            : pendingCount > 0
            ? `${pendingCount} offline records awaiting sync`
            : lastSyncTime
            ? `Online & Synchronized (Last at ${lastSyncTime})`
            : "Online & Synchronized"
        }
      >
        <span className="relative flex h-2 w-2">
          {!isOnline ? (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
          ) : pendingCount > 0 ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          )}
        </span>

        <span className="hidden sm:inline">
          {!isOnline
            ? "Offline"
            : pendingCount > 0
            ? `${pendingCount} Pending`
            : "Synced"}
        </span>

        {/* Icons */}
        {!isOnline ? (
          <WifiOff className="w-3 h-3 text-rose-600 sm:hidden" />
        ) : pendingCount > 0 ? (
          <span className="text-[10px] font-black sm:hidden">{pendingCount}</span>
        ) : (
          <Wifi className="w-3 h-3 text-emerald-600 sm:hidden" />
        )}
      </div>

      {/* Manual Sync Button */}
      <button
        type="button"
        onClick={syncNow}
        disabled={isSyncing}
        title="Synchronize offline local database with cloud server"
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition disabled:opacity-50"
      >
        <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin text-amber-600" : ""}`} />
        <span className="hidden md:inline">{isSyncing ? "Syncing..." : "Sync"}</span>
      </button>
    </div>
  );
}
