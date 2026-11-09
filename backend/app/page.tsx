"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, Search, Edit2, Trash2, CheckCircle2, AlertCircle, RefreshCw, Calendar, Truck, User } from "lucide-react";

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

      if (!gariRes.ok || !rozRes.ok) {
        throw new Error("Failed to load records from backend bridge.");
      }

      const gariData = await gariRes.json();
      const rozData = await rozRes.json();

      setGariyan(Array.isArray(gariData) ? gariData : []);
      setEntries(Array.isArray(rozData) ? rozData : []);
    } catch (err: any) {
      setError(err.message || "Failed to communicate with C# SQLite backend.");
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
      if (!res.ok) throw new Error("Delete failed on backend.");
      setSuccess("Entry deleted successfully.");
      setTimeout(() => setSuccess(null), 3000);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
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

      setSuccess(editingId ? "Entry updated successfully!" : "New daily entry saved successfully!");
      setTimeout(() => setSuccess(null), 4000);
      resetForm();
      loadData();
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
            Record daily vehicle trips, transportation freight (Kiraya), expenses (Kharcha), and advances (Peshgi).
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
            <p className="font-semibold text-sm">Error</p>
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

      {/* Main Entry Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 flex justify-between items-center">
          <h3 className="font-bold text-base flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-400" />
            {editingId ? `Edit Roznamcha Entry #${editingId}` : "Nayi Entry (New Daily Entry)"}
          </h3>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-xs bg-slate-700 hover:bg-slate-600 px-2.5 py-1 rounded text-slate-200 transition"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Tareekh / Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tareekh (Date) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* 2. Gari Number / Vehicle */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gari Number (Vehicle) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-1.5">
                <select
                  value={gariNo}
                  onChange={(e) => handleVehicleSelect(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                >
                  <option value="">-- Select Vehicle --</option>
                  {gariyan.map((g) => (
                    <option key={g.id} value={g.gariNo}>
                      {g.gariNo} ({g.malik})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Or Type"
                  value={gariNo}
                  onChange={(e) => setGariNo(e.target.value)}
                  className="w-24 text-sm border border-slate-300 rounded-lg px-2 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 3. Driver / Driver Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Driver (Driver Name) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Iqbal"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                required
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* 4. Maal / Material */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Maal (Material / Goods)
              </label>
              <input
                type="text"
                placeholder="e.g. 60 Ton Tarkol, Bajri, Ret"
                value={maal}
                onChange={(e) => setMaal(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* 5. Diesel / Diesel Liters */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diesel (Liters)
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
            <span className="text-xs font-semibold text-slate-500">Gari:</span>
            <select
              value={filterGari}
              onChange={(e) => setFilterGari(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Vehicles</option>
              {gariyan.map((g) => (
                <option key={g.id} value={g.gariNo}>
                  {g.gariNo}
                </option>
              ))}
            </select>
          </div>

          {/* Driver Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-500">Driver:</span>
            <input
              type="text"
              placeholder="Search driver"
              value={filterDriver}
              onChange={(e) => setFilterDriver(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 w-28 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* General Search */}
          <div className="flex items-center space-x-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 w-36 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
              className="text-xs text-rose-600 hover:underline font-semibold"
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
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Loading records from SQLite database...
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
                    <td className="py-2.5 px-3 font-medium text-slate-700">{row.displayDate}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded border border-slate-200">
                        {row.gariNo}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">{row.driverName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{row.maal || "—"}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{row.dieselLiter > 0 ? `${row.dieselLiter} L` : "—"}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                      Rs. {row.kiraya.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-rose-700">
                      Rs. {row.kharcha.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-amber-700">
                      Rs. {row.advance.toLocaleString()}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${row.baqaya >= 0 ? "text-slate-900" : "text-rose-600"}`}>
                      Rs. {row.baqaya.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex justify-center items-center gap-1.5">
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
    </div>
  );
}
