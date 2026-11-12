"use client";

import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Calendar,
  Truck,
  User,
  Printer,
  X,
  FileText,
  Fuel,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from "lucide-react";

interface RoznamchaItem {
  id: number;
  date: string;
  displayDate: string;
  gariNo: string;
  driverName: string;
  maal: string;
  dieselLiter: number;
  kiraya: number;
  kharcha: number;
  advance: number;
  baqaya: number;
}

interface Gari {
  id: number;
  gariNo: string;
  driverName: string;
  malik: string;
  phone: string;
}

export default function AajKiEntryPage() {
  const [entries, setEntries] = useState<RoznamchaItem[]>([]);
  const [gariyan, setGariyan] = useState<Gari[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [gariNo, setGariNo] = useState("");
  const [driverName, setDriverName] = useState("");
  const [maal, setMaal] = useState("");
  const [dieselLiter, setDieselLiter] = useState<number | "">("");
  const [kiraya, setKiraya] = useState<number | "">("");
  const [kharcha, setKharcha] = useState<number | "">("");
  const [advance, setAdvance] = useState<number | "">("");

  // Thermal Receipt State
  const [receiptItem, setReceiptItem] = useState<RoznamchaItem | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Filter States
  const [filterDate, setFilterDate] = useState("");
  const [filterGari, setFilterGari] = useState("");
  const [filterDriver, setFilterDriver] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [gariRes, rozRes] = await Promise.all([
        fetch("/api/gariyan"),
        fetch("/api/roznamcha"),
      ]);

      const gariData = gariRes.ok ? await gariRes.json().catch(() => []) : [];
      const rozData = rozRes.ok ? await rozRes.json().catch(() => []) : [];

      setGariyan(Array.isArray(gariData) ? gariData : []);
      setEntries(Array.isArray(rozData) ? rozData : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVehicleSelect = (selectedNo: string) => {
    setGariNo(selectedNo);
    const vehicle = gariyan.find((g) => g.gariNo === selectedNo);
    if (vehicle && vehicle.driverName) {
      setDriverName(vehicle.driverName);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormDate(new Date().toISOString().split("T")[0]);
    setGariNo("");
    setDriverName("");
    setMaal("");
    setDieselLiter("");
    setKiraya("");
    setKharcha("");
    setAdvance("");
  };

  const handleEdit = (item: RoznamchaItem) => {
    setEditingId(item.id);
    setFormDate(item.date);
    setGariNo(item.gariNo);
    setDriverName(item.driverName);
    setMaal(item.maal);
    setDieselLiter(item.dieselLiter || "");
    setKiraya(item.kiraya || "");
    setKharcha(item.kharcha || "");
    setAdvance(item.advance || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(`Are you sure you want to delete Roznamcha entry #${id}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/roznamcha/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed.");
      setSuccess("Entry deleted successfully.");
      setTimeout(() => setSuccess(null), 3000);
      loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to delete.");
    }
  };

  const handlePrintReceipt = (item: RoznamchaItem) => {
    setReceiptItem(item);
    setShowReceiptModal(true);
  };

  const executePrint = () => {
    window.print();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!gariNo.trim()) {
      setError("Please select or enter vehicle number (Gari Number).");
      return;
    }
    if (!driverName.trim()) {
      setError("Please enter driver name (Driver).");
      return;
    }

    const payload = {
      date: formDate,
      gariNo: gariNo.trim(),
      driverName: driverName.trim(),
      maal: maal.trim(),
      dieselLiter: Number(dieselLiter) || 0,
      kiraya: Number(kiraya) || 0,
      kharcha: Number(kharcha) || 0,
      advance: Number(advance) || 0,
    };

    if (payload.dieselLiter < 0 || payload.kiraya < 0 || payload.kharcha < 0 || payload.advance < 0) {
      setError("Values cannot be negative.");
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/roznamcha/${editingId}` : "/api/roznamcha";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || "Failed to save record.");
      }

      const savedData = await res.json().catch(() => ({}));
      const currentItem: RoznamchaItem = {
        id: savedData.id || editingId || Date.now(),
        date: payload.date,
        displayDate: new Date(payload.date).toLocaleDateString("en-GB"),
        gariNo: payload.gariNo,
        driverName: payload.driverName,
        maal: payload.maal,
        dieselLiter: payload.dieselLiter,
        kiraya: payload.kiraya,
        kharcha: payload.kharcha,
        advance: payload.advance,
        baqaya: payload.kiraya - payload.kharcha - payload.advance,
      };

      setSuccess(editingId ? "Entry updated successfully!" : "New daily entry saved successfully!");
      setTimeout(() => setSuccess(null), 4000);
      resetForm();
      loadData();

      // Trigger Thermal Receipt Modal Option
      setReceiptItem(currentItem);
      setShowReceiptModal(true);
    } catch (err: any) {
      setError(err?.message || "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  // Filtered entries
  const filteredEntries = entries.filter((item) => {
    if (filterDate && item.date !== filterDate) return false;
    if (filterGari && item.gariNo !== filterGari) return false;
    if (filterDriver && !item.driverName.toLowerCase().includes(filterDriver.toLowerCase())) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        item.gariNo.toLowerCase().includes(q) ||
        item.driverName.toLowerCase().includes(q) ||
        item.maal.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Calculate live preview Baqaya
  const liveKiraya = Number(kiraya) || 0;
  const liveKharcha = Number(kharcha) || 0;
  const liveAdvance = Number(advance) || 0;
  const liveBaqaya = liveKiraya - liveKharcha - liveAdvance;

  // Aggregate totals
  const totalKirayaSummary = filteredEntries.reduce((sum, e) => sum + (e.kiraya || 0), 0);
  const totalBaqayaSummary = filteredEntries.reduce((sum, e) => sum + (e.baqaya || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Title & Banner - Mobile Optimized */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-700/80 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-400/30">
                <Calendar className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                Aaj Ki Entry — Daily Roznamcha
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              گاڑی و ڈرائیور روانگی، کرایہ، خرچہ، ڈیزل اور بقایا حساب کتاب
            </p>
          </div>
          <button
            onClick={loadData}
            className="self-end sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-600 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Quick KPI Bar for Mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-700/60 text-xs">
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Trips Recorded</span>
            <div className="text-sm font-bold text-slate-100">{filteredEntries.length} Trips</div>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Kiraya</span>
            <div className="text-sm font-bold text-emerald-400">Rs. {totalKirayaSummary.toLocaleString()}</div>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Baqaya</span>
            <div className="text-sm font-bold text-amber-400">Rs. {totalBaqayaSummary.toLocaleString()}</div>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Thermal Printing</span>
            <div className="text-sm font-bold text-sky-400 flex items-center gap-1">
              <Printer className="w-3.5 h-3.5" /> 80mm Active
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 sm:p-4 rounded-xl flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Notice</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 sm:p-4 rounded-xl flex items-start gap-2.5 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Success</p>
            <p>{success}</p>
          </div>
        </div>
      )}

      {/* Entry Form Card - Clean Mobile First Form */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <PlusCircle className="w-4 h-4 text-amber-500" />
            <span>{editingId ? `Edit Entry #${editingId}` : "Nayi Entry Shamil Karein (نئی انٹری درج کریں)"}</span>
          </h3>
          {editingId && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
              Editing Mode Active
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date (تاریخ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50/50"
              />
            </div>

            {/* 2. Gari No */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Gari No (گاڑی نمبر) <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  required
                  placeholder="e.g. 786 or LES-992"
                  value={gariNo}
                  onChange={(e) => setGariNo(e.target.value)}
                  className="w-full text-sm font-semibold border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
                />
                {gariyan.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => handleVehicleSelect(e.target.value)}
                    className="border border-slate-300 rounded-xl px-2 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                    title="Select registered vehicle"
                  >
                    <option value="">Choose</option>
                    {gariyan.map((g) => (
                      <option key={g.id} value={g.gariNo}>
                        {g.gariNo}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* 3. Driver Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Driver Name (ڈرائیور) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Driver Name"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* 4. Maal / Material */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Maal (مال / Material)
              </label>
              <input
                type="text"
                placeholder="e.g. High Speed Diesel, Oil"
                value={maal}
                onChange={(e) => setMaal(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* 5. Diesel Liter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Diesel Fuel (Ltr)</span>
                <Fuel className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 100"
                value={dieselLiter}
                onChange={(e) => setDieselLiter(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* 6. Kiraya / Freight */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Kiraya (کرایہ)</span>
                <span className="text-emerald-600 font-bold">Rs.</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 35000"
                value={kiraya}
                onChange={(e) => setKiraya(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full text-sm border border-emerald-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-emerald-800 bg-emerald-50/20"
              />
            </div>

            {/* 7. Kharcha / Expenses */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Kharcha (خرچہ)</span>
                <span className="text-rose-600 font-bold">Rs.</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 5000"
                value={kharcha}
                onChange={(e) => setKharcha(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full text-sm border border-rose-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none font-bold text-rose-800 bg-rose-50/20"
              />
            </div>

            {/* 8. Advance / Peshgi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Advance / Peshgi</span>
                <span className="text-amber-600 font-bold">Rs.</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 10000"
                value={advance}
                onChange={(e) => setAdvance(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full text-sm border border-amber-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold text-amber-800 bg-amber-50/20"
              />
            </div>
          </div>

          {/* Live Baqaya Preview & Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex items-center justify-between sm:justify-start space-x-3 bg-slate-100/80 px-4 py-2.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700">Calculated Net Baqaya:</span>
              <span className={`text-base font-black ${liveBaqaya >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                Rs. {liveBaqaya.toLocaleString()}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Update Entry" : "Save Daily Entry (محفوظ کریں)"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row gap-2.5 justify-between">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
          {/* Date Filter */}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-amber-500"
            title="Filter by date"
          />

          {/* Vehicle Filter */}
          <input
            type="text"
            placeholder="Vehicle No..."
            value={filterGari}
            onChange={(e) => setFilterGari(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-amber-500"
          />

          {/* Driver Filter */}
          <input
            type="text"
            placeholder="Driver Name..."
            value={filterDriver}
            onChange={(e) => setFilterDriver(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-amber-500"
          />

          {/* Search Query */}
          <input
            type="text"
            placeholder="Search material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {(filterDate || filterGari || filterDriver || searchQuery) && (
          <button
            onClick={() => {
              setFilterDate("");
              setFilterGari("");
              setFilterDriver("");
              setSearchQuery("");
            }}
            className="self-end text-xs text-rose-600 hover:text-rose-700 font-bold underline px-2 py-1"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Mobile Card Feed (Visible on Mobile / Small Screens) */}
      <div className="block lg:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            Loading Roznamcha records...
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            No Roznamcha records found matching the criteria.
          </div>
        ) : (
          filteredEntries.map((row) => (
            <div
              key={row.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {row.gariNo}
                    </span>
                    <span className="font-bold text-xs text-slate-700">{row.driverName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{row.displayDate || row.date}</span>
                    {row.maal && <span>• {row.maal}</span>}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Net Baqaya</span>
                  <span
                    className={`text-sm font-black ${
                      row.baqaya >= 0 ? "text-slate-900" : "text-rose-600"
                    }`}
                  >
                    Rs. {Number(row.baqaya || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
                <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-emerald-800 font-semibold block">Kiraya</span>
                  <span className="font-bold text-emerald-700">Rs. {Number(row.kiraya || 0).toLocaleString()}</span>
                </div>
                <div className="bg-rose-50/60 p-2 rounded-xl border border-rose-100">
                  <span className="text-[10px] text-rose-800 font-semibold block">Kharcha</span>
                  <span className="font-bold text-rose-700">Rs. {Number(row.kharcha || 0).toLocaleString()}</span>
                </div>
                <div className="bg-amber-50/60 p-2 rounded-xl border border-amber-100">
                  <span className="text-[10px] text-amber-800 font-semibold block">Advance</span>
                  <span className="font-bold text-amber-700">Rs. {Number(row.advance || 0).toLocaleString()}</span>
                </div>
              </div>

              {row.dieselLiter > 0 && (
                <div className="text-[11px] text-slate-600 flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
                  <Fuel className="w-3.5 h-3.5 text-amber-600" />
                  <span>Diesel Consumption: <strong>{row.dieselLiter} Liters</strong></span>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handlePrintReceipt(row)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-amber-400 hover:bg-amber-500 rounded-lg shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Thermal Receipt</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(row)}
                    className="p-1.5 text-blue-600 bg-blue-50 rounded-lg border border-blue-200"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(row.id)}
                    className="p-1.5 text-rose-600 bg-rose-50 rounded-lg border border-rose-200"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (Hidden on Mobile) */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[11px] tracking-wider font-semibold">
                <th className="py-3 px-3">Date (تاریخ)</th>
                <th className="py-3 px-3">Gari No (گاڑی نمبر)</th>
                <th className="py-3 px-3">Driver (ڈرائیور)</th>
                <th className="py-3 px-3">Maal (مال / Material)</th>
                <th className="py-3 px-3 text-right">Diesel (Ltr)</th>
                <th className="py-3 px-3 text-right">Kiraya (کرایہ)</th>
                <th className="py-3 px-3 text-right">Kharcha (خرچہ)</th>
                <th className="py-3 px-3 text-right">Advance (پیشگی)</th>
                <th className="py-3 px-3 text-right">Baqaya (بقایا)</th>
                <th className="py-3 px-3 text-center">Receipt & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Loading records from database...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No Roznamcha records found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((row) => (
                  <tr key={row.id} className="hover:bg-amber-50/40 transition">
                    <td className="py-2.5 px-3 font-medium text-slate-700">{row.displayDate || row.date}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded border border-slate-200">
                        {row.gariNo}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">{row.driverName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{row.maal || "—"}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{row.dieselLiter > 0 ? `${row.dieselLiter} L` : "—"}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                      Rs. {Number(row.kiraya || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-rose-700">
                      Rs. {Number(row.kharcha || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-amber-700">
                      Rs. {Number(row.advance || 0).toLocaleString()}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${row.baqaya >= 0 ? "text-slate-900" : "text-rose-600"}`}>
                      Rs. {Number(row.baqaya || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        <button
                          onClick={() => handlePrintReceipt(row)}
                          title="Print Thermal Receipt (80mm)"
                          className="p-1 hover:bg-amber-100 text-amber-700 bg-amber-50 rounded border border-amber-200"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEdit(row)}
                          title="Edit"
                          className="p-1 hover:bg-slate-100 text-blue-600 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          title="Delete"
                          className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thermal Receipt Print Modal (80mm Thermal Printer) */}
      {showReceiptModal && receiptItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 no-print">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-amber-600" />
                Thermal Receipt (80mm)
              </h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Thermal Slip Area */}
            <div
              id="thermal-receipt-print-area"
              className="my-4 p-4 border border-dashed border-slate-300 rounded-lg bg-amber-50/20 font-mono text-xs text-slate-900 space-y-2 overflow-y-auto"
              style={{ width: "80mm", margin: "0 auto" }}
            >
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                <div className="text-base font-black tracking-wide">ROONJHA DEVELOPERS</div>
                <div className="text-[10px] font-bold text-slate-700">OIL SHOP & TRANSPORT ROZNAMCHA</div>
                <div className="text-[10px] text-slate-600">وینڈر، پٹرول پمپ و ٹرانسپورٹ کھاتہ</div>
                <div className="text-[10px] text-slate-500">Receipt #{receiptItem.id} | {receiptItem.date}</div>
              </div>

              <div className="space-y-1 py-1 border-b border-dashed border-slate-400 text-[11px]">
                <div className="flex justify-between">
                  <span>Gari No (گاڑی):</span>
                  <span className="font-bold">{receiptItem.gariNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Driver (ڈرائیور):</span>
                  <span className="font-bold">{receiptItem.driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Maal (مال):</span>
                  <span>{receiptItem.maal || "General"}</span>
                </div>
                {receiptItem.dieselLiter > 0 && (
                  <div className="flex justify-between">
                    <span>Diesel Fuel:</span>
                    <span>{receiptItem.dieselLiter} Liters</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 py-1 border-b border-dashed border-slate-400 text-[11px]">
                <div className="flex justify-between">
                  <span>Kiraya (کرایہ):</span>
                  <span className="font-bold">Rs. {Number(receiptItem.kiraya || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>Kharcha (خرچہ):</span>
                  <span>- Rs. {Number(receiptItem.kharcha || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span>Advance (پیشگی):</span>
                  <span>- Rs. {Number(receiptItem.advance || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-1 text-xs font-black flex justify-between items-center">
                <span>Net Baqaya (بقایا):</span>
                <span className="text-sm">Rs. {Number(receiptItem.baqaya || 0).toLocaleString()}</span>
              </div>

              {/* Developer Attribution Required by User */}
              <div className="text-center pt-3 border-t border-dashed border-slate-400 space-y-0.5 text-[9px] text-slate-600">
                <p className="font-bold">Software by Roonjha Developer</p>
                <p className="font-black text-[11px] text-slate-800 tracking-wider">📞 03152914836</p>
                <p className="text-[8px] text-slate-400">Thank you for your business!</p>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-200 no-print">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={executePrint}
                className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                Print Thermal Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
