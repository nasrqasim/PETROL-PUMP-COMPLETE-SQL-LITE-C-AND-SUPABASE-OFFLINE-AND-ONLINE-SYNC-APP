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
      setError(err.message || "Failed to load data.");
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
      setError(err.message);
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
      setError(err.message);
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

  return (
    <div className="space-y-6">
      {/* Title & Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            Aaj Ki Entry — Daily Roznamcha Entry
          </h2>
          <p className="text-sm text-slate-500">
            Record daily vehicle trips, transportation freight (Kiraya), expenses (Kharcha), advances (Peshgi), and instant thermal receipt printing.
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Notice</p>
            <p className="text-xs">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Success</p>
            <p className="text-xs">{success}</p>
          </div>
        </div>
      )}

      {/* Entry Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <PlusCircle className="w-4 h-4 text-amber-500" />
            <span>{editingId ? `Edit Entry #${editingId}` : "Nayi Entry Shamil Karein (نئی انٹری شامل کریں)"}</span>
          </h3>
          {editingId && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
              Editing Mode Active
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* 1. Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date (تاریخ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* 2. Gari No */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gari No (گاڑی نمبر) <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  required
                  placeholder="e.g. 786 or LES-992"
                  value={gariNo}
                  onChange={(e) => setGariNo(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                {gariyan.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => handleVehicleSelect(e.target.value)}
                    className="border border-slate-300 rounded-lg px-2 text-xs bg-slate-50 text-slate-600 hover:bg-slate-100"
                    title="Select registered vehicle"
                  >
                    <option value="">Select</option>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Driver Name (ڈرائیور) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Driver Name"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* 4. Maal / Material */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Maal (مال / Material)
              </label>
              <input
                type="text"
                placeholder="e.g. Diesel, Engine Oil, Sand"
                value={maal}
                onChange={(e) => setMaal(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* 5. Diesel Liter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diesel (Liters) <span className="text-xs text-slate-400">(ڈیزل لیٹر)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 100"
                value={dieselLiter}
                onChange={(e) => setDieselLiter(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* 6. Kiraya / Freight */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kiraya (Freight / Transport) <span className="text-xs text-slate-400">(Rs.)</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 35000"
                value={kiraya}
                onChange={(e) => setKiraya(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold text-emerald-700"
              />
            </div>

            {/* 7. Kharcha / Expenses */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kharcha (Expenses) <span className="text-xs text-slate-400">(Rs.)</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 5000"
                value={kharcha}
                onChange={(e) => setKharcha(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold text-rose-700"
              />
            </div>

            {/* 8. Advance / Peshgi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Advance / Peshgi (Advance) <span className="text-xs text-slate-400">(Rs.)</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 10000"
                value={advance}
                onChange={(e) => setAdvance(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold text-amber-700"
              />
            </div>
          </div>

          {/* Live Baqaya Preview & Actions */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-600">Calculated Baqaya (Remaining):</span>
              <span className={`text-base font-bold ${liveBaqaya >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                Rs. {liveBaqaya.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">(Kiraya - Kharcha - Advance)</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-lg shadow transition disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Update Entry" : "Save Daily Entry (محفوظ کریں)"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Date Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-500">Date:</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Vehicle Filter */}
          <div className="flex items-center space-x-1.5">
            <Truck className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter Gari No..."
              value={filterGari}
              onChange={(e) => setFilterGari(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 w-32 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Driver Filter */}
          <div className="flex items-center space-x-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter Driver..."
              value={filterDriver}
              onChange={(e) => setFilterDriver(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 w-32 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Search Query */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search in Roznamcha..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline ml-2"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-800">{filteredEntries.length}</span> of {entries.length} entries
        </div>
      </div>

      {/* Entries Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
