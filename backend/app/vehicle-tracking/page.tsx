"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Truck,
  MapPin,
  Clock,
  Navigation,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  PlusCircle,
  Printer,
  Share2,
  ChevronRight,
  ArrowRight,
  ArrowUpRight,
  Activity,
  Layers,
  Fuel,
  User,
  ShieldCheck,
  Building,
  RotateCw,
  X,
  History,
} from "lucide-react";
import { printTableDocument } from "@/lib/print-table";
import {
  createLedgerStatementImageBlob,
  shareOrDownloadWhatsApp,
} from "@/lib/whatsapp-image";

export type VehicleTripStatus =
  | "Available / At Base"
  | "Loading"
  | "Loaded / Ready to Depart"
  | "On the Way"
  | "At Destination"
  | "Unloading"
  | "Returning"
  | "Returned to Base"
  | "Trip Completed"
  | "Pending"
  | "Under Maintenance";

const STATUS_OPTIONS: { label: VehicleTripStatus; color: string; bg: string }[] = [
  { label: "Available / At Base", color: "text-slate-800", bg: "bg-slate-100 border-slate-300" },
  { label: "Loading", color: "text-amber-800", bg: "bg-amber-100 border-amber-300" },
  { label: "Loaded / Ready to Depart", color: "text-indigo-800", bg: "bg-indigo-100 border-indigo-300" },
  { label: "On the Way", color: "text-sky-800", bg: "bg-sky-100 border-sky-300" },
  { label: "At Destination", color: "text-purple-800", bg: "bg-purple-100 border-purple-300" },
  { label: "Unloading", color: "text-orange-800", bg: "bg-orange-100 border-orange-300" },
  { label: "Returning", color: "text-rose-800", bg: "bg-rose-100 border-rose-300" },
  { label: "Returned to Base", color: "text-emerald-800", bg: "bg-emerald-100 border-emerald-300" },
  { label: "Trip Completed", color: "text-emerald-900", bg: "bg-emerald-200 border-emerald-400" },
  { label: "Pending", color: "text-yellow-800", bg: "bg-yellow-100 border-yellow-300" },
  { label: "Under Maintenance", color: "text-rose-900", bg: "bg-rose-200 border-rose-400" },
];

export default function VehicleTrackingPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({ summary: {}, vehicles: [] });
  const [savedLocations, setSavedLocations] = useState<any[]>([]);

  // Update Status Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusVehicle, setStatusVehicle] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<VehicleTripStatus>("On the Way");
  const [newLocation, setNewLocation] = useState("");
  const [newDestination, setNewDestination] = useState("");
  const [statusRemarks, setStatusRemarks] = useState("");
  const [statusTime, setStatusTime] = useState(() =>
    new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );
  const [statusUpdatedBy, setStatusUpdatedBy] = useState("Dispatch Incharge");
  const [savingStatus, setSavingStatus] = useState(false);

  // Vehicle History Timeline Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyVehicleNo, setHistoryVehicleNo] = useState<string>("");
  const [historyData, setHistoryData] = useState<any | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);

  const loadTrackingData = async (dateVal = selectedDate, statusVal = statusFilter, searchVal = search) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        date: dateVal,
        status: statusVal,
        search: searchVal,
      });
      const [res, locRes] = await Promise.all([
        fetch(`/api/vehicle-tracking?${q.toString()}`),
        fetch("/api/locations").catch(() => null),
      ]);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
      if (locRes && locRes.ok) {
        const locJson = await locRes.json().catch(() => []);
        setSavedLocations(Array.isArray(locJson) ? locJson : []);
      }
    } catch (err) {
      console.error("Error loading vehicle tracking:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrackingData(selectedDate, statusFilter, search);
  }, [selectedDate, statusFilter, search]);

  // Open Update Status Modal
  const handleOpenStatusModal = (v: any) => {
    setStatusVehicle(v);
    setNewStatus(v.status || "On the Way");
    setNewLocation(v.currentLocation || v.startingLocation || "");
    setNewDestination(v.destination || "");
    setStatusRemarks("");
    setStatusTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    setShowStatusModal(true);
  };

  // Submit Status Update
  const handleSubmitStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusVehicle || !newLocation.trim()) return;
    setSavingStatus(true);
    try {
      const res = await fetch("/api/vehicle-tracking/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gariNo: statusVehicle.gariNo,
          driverName: statusVehicle.driverName,
          status: newStatus,
          currentLocation: newLocation.trim(),
          destination: newDestination.trim(),
          tripId: statusVehicle.tripId,
          date: selectedDate,
          time: statusTime,
          remarks: statusRemarks.trim(),
          updatedBy: statusUpdatedBy.trim(),
        }),
      });

      if (res.ok) {
        setShowStatusModal(false);
        setNotification(`Vehicle ${statusVehicle.gariNo} status updated to "${newStatus}"!`);
        setTimeout(() => setNotification(null), 4000);
        loadTrackingData();
      } else {
        alert("Failed to update vehicle status.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSavingStatus(false);
    }
  };

  // Open Individual Vehicle History Modal
  const handleOpenHistory = async (gariNo: string) => {
    setHistoryVehicleNo(gariNo);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/vehicle-tracking/history/${encodeURIComponent(gariNo)}`);
      if (res.ok) {
        const json = await res.json();
        setHistoryData(json);
      }
    } catch (err) {
      console.error("Error loading vehicle history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Print Clean Table Document
  const handlePrintTrackingTable = () => {
    const vehicles: any[] = data.vehicles || [];
    printTableDocument({
      title: "Vehicle Daily Status & Location Tracking",
      subtitle: `Recorded Activity for Date: ${selectedDate} • Muslim Construction Fleet`,
      headers: [
        "Vehicle #",
        "Vehicle Type",
        "Driver Name",
        "Trip #",
        "Starting Point",
        "Current Location",
        "Destination",
        "Departure",
        "Trip Status",
        "Last Updated",
      ],
      columnAlignments: ["center", "left", "left", "center", "left", "left", "left", "center", "center", "left"],
      rows: vehicles.map((v) => [
        v.gariNo,
        v.vehicleName || "Dumper / Truck",
        v.driverName || "—",
        v.tripNumber || (v.hasTodayEntry ? `TRIP-${v.tripId}` : "No Entry"),
        v.startingLocation || "Base",
        v.currentLocation || "Base",
        v.destination || "—",
        v.departureTime || "—",
        v.status,
        v.lastUpdated || "—",
      ]),
      footers: [
        `TOTAL (${vehicles.length} FLEET VEHICLES)`,
        "",
        "",
        `Active: ${summary.activeToday || 0}`,
        "",
        `On Trip: ${summary.onTrip || 0}`,
        `At Dest: ${summary.atDestination || 0}`,
        "",
        `Completed: ${summary.tripsCompleted || 0}`,
        `Pending: ${summary.tripsPending || 0}`,
      ],
      notes: "Software By Roonjha Developers : 03152914836 - Muslim Construction & Transport Management System",
    });
  };

  // Share Single Vehicle Status on WhatsApp Image
  const handleShareVehicleWhatsApp = async (v: any) => {
    try {
      const blob = await createLedgerStatementImageBlob({
        title: `VEHICLE STATUS: ${v.gariNo}`,
        subtitle: `Daily Dispatch & Location Checkpoint`,
        partyName: `Vehicle: ${v.gariNo} • Driver: ${v.driverName}`,
        partyPhone: v.contactPhone || "+92 315 2914836",
        dateRange: selectedDate,
        openingBalance: 0,
        totalIn: 0,
        totalOut: 0,
        closingBalance: 0,
        transactions: [
          {
            date: selectedDate,
            voucher: v.tripNumber || "CHECKPOINT",
            desc: `Route: ${v.startingLocation || "Base"} → ${v.destination || "Base"} [${v.status}]`,
            balance: 0,
          },
          {
            date: selectedDate,
            voucher: "LOCATION",
            desc: `Current Position: ${v.currentLocation || "Base Yard"}`,
            balance: 0,
          },
        ],
      });

      await shareOrDownloadWhatsApp({
        blob,
        filename: `Vehicle-${v.gariNo}-Status-${selectedDate}.png`,
        shareTitle: `Muslim Construction - Vehicle ${v.gariNo} Status`,
        shareText: `*Muslim Construction Fleet Tracking*\nVehicle: *${v.gariNo}*\nDriver: *${v.driverName}*\nStatus: *${v.status}*\nCurrent Location: *${v.currentLocation}*\nDestination: *${v.destination}*\nDate: ${selectedDate}\n\nSoftware By Roonjha Developers: 03152914836`,
        whatsappPhone: v.contactPhone,
      });
    } catch (err: any) {
      alert("Failed to share vehicle status: " + err.message);
    }
  };

  const summary = data.summary || {};
  const vehicles: any[] = data.vehicles || [];

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Navigation className="w-5 h-5 text-amber-600" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Vehicle Daily Status & Location Tracking
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Live fleet dispatch locations, trip progress, delivery checkpoints, and historical vehicle movements
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Picker & Presets */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
              className={`px-2.5 py-1 rounded-lg transition ${
                selectedDate === new Date().toISOString().split("T")[0]
                  ? "bg-slate-900 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                setSelectedDate(y.toISOString().split("T")[0]);
              }}
              className="px-2 py-1 rounded-lg text-slate-600 hover:text-slate-900 transition"
            >
              Yesterday
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Print Table Button */}
          <button
            type="button"
            onClick={handlePrintTrackingTable}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
            title="Print entire vehicle tracking table"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print Ledger</span>
          </button>

          {/* Quick Refresh */}
          <button
            type="button"
            onClick={() => loadTrackingData()}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Refresh live data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* 2. Top Summary KPI Cards (9 Required Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3 no-print top-cards-box">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Fleet</span>
          <span className="text-xl font-black text-slate-900">{summary.totalRegistered || 0}</span>
          <span className="text-[10px] text-slate-500 block">Registered</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-emerald-600 uppercase font-bold block">Active Today</span>
          <span className="text-xl font-black text-emerald-600">{summary.activeToday || 0}</span>
          <span className="text-[10px] text-slate-500 block">With Trips</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-sky-600 uppercase font-bold block">On Trip</span>
          <span className="text-xl font-black text-sky-600">{summary.onTrip || 0}</span>
          <span className="text-[10px] text-slate-500 block">En Route</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-amber-600 uppercase font-bold block">Loading</span>
          <span className="text-xl font-black text-amber-600">{summary.atLoading || 0}</span>
          <span className="text-[10px] text-slate-500 block">At Quarry</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-purple-600 uppercase font-bold block">Destination</span>
          <span className="text-xl font-black text-purple-600">{summary.atDestination || 0}</span>
          <span className="text-[10px] text-slate-500 block">At Site</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-emerald-700 uppercase font-bold block">Returned</span>
          <span className="text-xl font-black text-emerald-700">{summary.returned || 0}</span>
          <span className="text-[10px] text-slate-500 block">At Base</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-teal-600 uppercase font-bold block">Completed</span>
          <span className="text-xl font-black text-teal-600">{summary.tripsCompleted || 0}</span>
          <span className="text-[10px] text-slate-500 block">Trips Done</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-rose-600 uppercase font-bold block">Pending</span>
          <span className="text-xl font-black text-rose-600">{summary.tripsPending || 0}</span>
          <span className="text-[10px] text-slate-500 block">In Progress</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">No Entry</span>
          <span className="text-xl font-black text-slate-500">{summary.noEntryToday || 0}</span>
          <span className="text-[10px] text-slate-500 block">Idle at Base</span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 no-print">
        {/* Status Filter Badges */}
        <div className="flex flex-wrap gap-1.5 overflow-x-auto max-w-full pb-1">
          {[
            { key: "all", label: "All Vehicles" },
            { key: "On the Way", label: "On the Way" },
            { key: "Loading", label: "Loading" },
            { key: "At Destination", label: "At Destination" },
            { key: "Returning", label: "Returning" },
            { key: "Returned to Base", label: "Returned" },
            { key: "Trip Completed", label: "Completed" },
            { key: "No Entry Today", label: "No Entry Today" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === tab.key
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search vehicle, driver, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
          />
        </div>
      </div>

      {/* 4. Table Card (Desktop) */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[11px] tracking-wider font-semibold">
                <th className="py-3 px-3">Vehicle</th>
                <th className="py-3 px-3">Driver</th>
                <th className="py-3 px-3">Trip Ref</th>
                <th className="py-3 px-3">Origin / Start</th>
                <th className="py-3 px-3">Current Location</th>
                <th className="py-3 px-3">Destination</th>
                <th className="py-3 px-3 text-center">Departure</th>
                <th className="py-3 px-3 text-center">Trip Status</th>
                <th className="py-3 px-3">Last Checkpoint</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Loading vehicle tracking records...
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No vehicle records found for the selected date and filters.
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => {
                  const statusOpt = STATUS_OPTIONS.find((s) => s.label === v.status);
                  return (
                    <tr key={v.gariNo} className="hover:bg-amber-50/30 transition">
                      {/* Vehicle Number & Type */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">
                            {v.gariNo}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                          {v.vehicleName}
                        </div>
                      </td>

                      {/* Driver */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">{v.driverName}</div>
                        {v.contactPhone && (
                          <div className="text-[10px] text-slate-400">{v.contactPhone}</div>
                        )}
                      </td>

                      {/* Trip Ref */}
                      <td className="py-3 px-3">
                        {v.hasTodayEntry ? (
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                            {v.tripNumber || `TRIP-${v.tripId}`}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold italic">
                            No Entry Today
                          </span>
                        )}
                      </td>

                      {/* Origin */}
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {v.startingLocation || "Site Base"}
                      </td>

                      {/* Current Location */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500 flex-shrink-0" />
                          <span>{v.currentLocation}</span>
                        </div>
                      </td>

                      {/* Destination */}
                      <td className="py-3 px-3 text-slate-700 font-semibold">
                        {v.destination || "Base Yard"}
                      </td>

                      {/* Departure */}
                      <td className="py-3 px-3 text-center text-slate-600">
                        {v.departureTime || "—"}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black border ${
                            statusOpt?.bg || "bg-slate-100 border-slate-200"
                          } ${statusOpt?.color || "text-slate-800"}`}
                        >
                          {v.status}
                        </span>
                      </td>

                      {/* Last Updated */}
                      <td className="py-3 px-3 text-slate-500 text-[10px]">
                        <div>{v.lastUpdated}</div>
                        <div className="text-slate-400 italic">By {v.updatedBy}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(v)}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[11px] transition shadow-xs"
                            title="Update vehicle current status and location"
                          >
                            Update
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenHistory(v.gariNo)}
                            className="p-1 hover:bg-slate-100 text-slate-700 rounded border border-slate-200"
                            title="View vehicle timeline history"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShareVehicleWhatsApp(v)}
                            className="p-1 hover:bg-emerald-50 text-emerald-600 rounded border border-emerald-200"
                            title="Share status on WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
              <tr>
                <td colSpan={3} className="py-3 px-3 font-black uppercase text-xs">
                  Fleet Summary ({vehicles.length} Vehicles)
                </td>
                <td colSpan={4} className="py-3 px-3 text-slate-700">
                  <span className="text-emerald-700 font-bold">Active: {summary.activeToday || 0}</span> |{" "}
                  <span className="text-sky-700 font-bold">On Trip: {summary.onTrip || 0}</span> |{" "}
                  <span className="text-purple-700 font-bold">At Destination: {summary.atDestination || 0}</span>
                </td>
                <td colSpan={3} className="py-3 px-3 text-center text-xs text-slate-800 font-bold">
                  Completed: {summary.tripsCompleted || 0} | Pending: {summary.tripsPending || 0}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 5. Mobile Cards Feed */}
      <div className="block lg:hidden space-y-3 no-print">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            Loading vehicle tracking...
          </div>
        ) : vehicles.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            No vehicle status recorded for this date.
          </div>
        ) : (
          vehicles.map((v) => {
            const statusOpt = STATUS_OPTIONS.find((s) => s.label === v.status);
            return (
              <div
                key={v.gariNo}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3"
              >
                <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">
                        {v.gariNo}
                      </span>
                      <span className="font-bold text-xs text-slate-800">{v.driverName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{v.vehicleName}</div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                      statusOpt?.bg || "bg-slate-100 border-slate-200"
                    } ${statusOpt?.color || "text-slate-800"}`}
                  >
                    {v.status}
                  </span>
                </div>

                {/* Location Grid */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Current Location
                      </span>
                      <span className="font-bold text-slate-900">{v.currentLocation}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-xl text-slate-600">
                    <div>
                      <span className="text-slate-400">Route: </span>
                      <strong>{v.startingLocation}</strong> → <strong>{v.destination}</strong>
                    </div>
                    {v.departureTime && (
                      <div className="text-slate-500 font-mono text-[10px]">Dep: {v.departureTime}</div>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 flex justify-between items-center pt-1">
                  <span>Last update: {v.lastUpdated}</span>
                  <span>By: {v.updatedBy}</span>
                </div>

                {/* Mobile Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenStatusModal(v)}
                    className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs text-center shadow-xs"
                  >
                    Update Status
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenHistory(v.gariNo)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>History</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShareVehicleWhatsApp(v)}
                    className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 6. Modal: Update Vehicle Status */}
      {showStatusModal && statusVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-amber-400" />
                  Update Status — Vehicle {statusVehicle.gariNo}
                </h3>
                <p className="text-[11px] text-slate-300">
                  Driver: {statusVehicle.driverName} • Date: {selectedDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitStatus} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trip Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as VehicleTripStatus)}
                  className="w-full text-xs font-bold border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.label} value={opt.label}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Current Location / Checkpoint <span className="text-rose-500">*</span>
                  </label>
                  {savedLocations.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => e.target.value && setNewLocation(e.target.value)}
                      className="text-[10px] text-amber-700 border border-amber-300 rounded px-1.5 py-0.5 bg-amber-50"
                    >
                      <option value="">Choose Saved Site...</option>
                      {savedLocations.map((loc) => (
                        <option key={loc.id} value={loc.name}>
                          {loc.name} ({loc.city})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Near Hub River Toll Plaza, Winder Quarry, Karachi Port"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Destination / Delivery Point
                </label>
                <input
                  type="text"
                  placeholder="e.g. Winder Mining Quarry / Site Area Hub"
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
                  <input
                    type="text"
                    value={statusTime}
                    onChange={(e) => setStatusTime(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Updated By</label>
                  <input
                    type="text"
                    value={statusUpdatedBy}
                    onChange={(e) => setStatusUpdatedBy(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Remarks / Status Details
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Loading completed, truck departed at 10:00 AM heading to site."
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStatus}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold transition disabled:opacity-50"
                >
                  {savingStatus ? "Saving..." : "Save Status Checkpoint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal: Individual Vehicle History Timeline */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-400" />
                  Vehicle History & Timeline — {historyVehicleNo}
                </h3>
                <p className="text-xs text-slate-300">
                  Complete chronological trip records and location checkpoints
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {loadingHistory ? (
                <div className="py-12 text-center text-slate-400">Loading history timeline...</div>
              ) : !historyData ? (
                <div className="py-12 text-center text-slate-400">No history available.</div>
              ) : (
                <>
                  {/* Vehicle Metrics Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Trips</span>
                      <div className="text-lg font-black text-slate-900">
                        {historyData.metrics?.totalTrips || 0}
                      </div>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-emerald-700 uppercase font-semibold">Total Freight</span>
                      <div className="text-lg font-black text-emerald-700">
                        Rs. {Number(historyData.metrics?.totalFreight || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
                      <span className="text-[10px] text-rose-700 uppercase font-semibold">Trip Expenses</span>
                      <div className="text-lg font-black text-rose-700">
                        Rs. {Number(historyData.metrics?.totalTripExpenses || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                      <span className="text-[10px] text-amber-700 uppercase font-semibold">Diesel Consumed</span>
                      <div className="text-lg font-black text-amber-700">
                        {historyData.metrics?.totalDieselLiters || 0} Liters
                      </div>
                    </div>
                  </div>

                  {/* Chronological Timeline */}
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-amber-500" />
                      Status Checkpoints Timeline
                    </h4>

                    {historyData.statusHistory?.length === 0 ? (
                      <p className="text-slate-400 italic">No status checkpoints recorded yet.</p>
                    ) : (
                      <div className="relative pl-6 border-l-2 border-slate-200 space-y-4">
                        {historyData.statusHistory?.map((h: any) => (
                          <div key={h.id} className="relative">
                            {/* Dot indicator */}
                            <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white shadow-xs"></span>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/60 pb-1.5 mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">{h.date}</span>
                                  <span className="text-[10px] font-mono text-slate-500">{h.time}</span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-900 text-white">
                                    {h.status}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400">By {h.updatedBy}</span>
                              </div>
                              <div className="font-semibold text-slate-800 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-rose-500" />
                                <span>{h.location}</span>
                                {h.destination && (
                                  <span className="text-slate-400 text-[11px] font-normal">
                                    → Destination: {h.destination}
                                  </span>
                                )}
                              </div>
                              {h.remarks && (
                                <p className="text-slate-600 text-[11px] mt-1 italic">
                                  &quot;{h.remarks}&quot;
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Trips Table */}
                  <div className="pt-3 border-t border-slate-100">
                    <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-sky-600" />
                      Recorded Roznamcha Trips ({historyData.trips?.length || 0})
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
                        <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="p-2">Date</th>
                            <th className="p-2">Driver</th>
                            <th className="p-2">Cargo / Route</th>
                            <th className="p-2 text-right">Freight</th>
                            <th className="p-2 text-right">Diesel</th>
                            <th className="p-2 text-right">Net</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {historyData.trips?.map((t: any) => (
                            <tr key={t.id}>
                              <td className="p-2 font-medium">{t.date}</td>
                              <td className="p-2">{t.driverName}</td>
                              <td className="p-2">
                                <div>{t.maal}</div>
                                {t.fromLocation && (
                                  <div className="text-[10px] text-slate-400">
                                    {t.fromLocation} → {t.toLocation}
                                  </div>
                                )}
                              </td>
                              <td className="p-2 text-right font-bold text-emerald-700">
                                Rs. {Number(t.kiraya || 0).toLocaleString()}
                              </td>
                              <td className="p-2 text-right font-mono">
                                {t.dieselLiter > 0 ? `${t.dieselLiter} L` : "—"}
                              </td>
                              <td className="p-2 text-right font-bold text-slate-900">
                                Rs. {Number(t.baqaya || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
