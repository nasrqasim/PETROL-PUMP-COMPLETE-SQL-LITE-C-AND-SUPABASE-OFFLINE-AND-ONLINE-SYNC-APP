"use client";

import React, { useState, useEffect } from "react";
import { UserCheck, Printer, Calendar, Truck, Clock } from "lucide-react";

interface DriverLedgerRecord {
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
  entryBaqaya: number;
  runningBalance: number;
}

interface DriverLedgerResponse {
  driverName: string;
  totalWorkingDays: number;
  totalTrips: number;
  vehiclesOperated: string[];
  totalKiraya: number;
  totalKharcha: number;
  totalAdvance: number;
  totalDiesel: number;
  driverBaqaya: number;
  records: DriverLedgerRecord[];
}

export default function DriverWiseKhataPage() {
  const [drivers, setDrivers] = useState<string[]>([]);
  const [selectedDriver, setSelectedDriver] = useState("Iqbal");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<DriverLedgerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Discover drivers from entries and registered vehicles
  useEffect(() => {
    Promise.all([fetch("/api/roznamcha"), fetch("/api/gariyan")])
      .then(async ([rozRes, gariRes]) => {
        const roz = await rozRes.json();
        const gari = await gariRes.json();
        const set = new Set<string>();
        if (Array.isArray(roz)) {
          roz.forEach((r: any) => {
            if (r.driverName) set.add(r.driverName);
          });
        }
        if (Array.isArray(gari)) {
          gari.forEach((g: any) => {
            if (g.driverName) set.add(g.driverName);
          });
        }
        const list = Array.from(set).sort();
        setDrivers(list);
        if (list.length > 0 && !list.includes(selectedDriver)) {
          setSelectedDriver(list[0]);
        }
      })
      .catch(() => {});
  }, []);

  const loadDriverLedger = async (driverName = selectedDriver) => {
    if (!driverName) return;
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (startDate) q.append("startDate", startDate);
      if (endDate) q.append("endDate", endDate);

      const url = `/api/reports/driver/${encodeURIComponent(driverName)}?${q.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load driver ledger.");
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Could not fetch driver ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDriver) {
      loadDriverLedger(selectedDriver);
    }
  }, [selectedDriver]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            Driver Wise Khata — Driver Financial Ledger & Work History
          </h2>
          <p className="text-sm text-slate-500">
            Track driver working days (unique dates), trips across all vehicles, advances, and remaining balance.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Ledger</span>
        </button>
      </div>

      {/* Driver Selector & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-4">
          {/* Driver Dropdown & Text */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-700">Select Driver:</label>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="text-sm font-semibold border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {drivers.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Or type driver"
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 w-32 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Date Range */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-xs text-slate-500 font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={() => loadDriverLedger()}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
            >
              Filter
            </button>
          </div>
        </div>

        {data && (
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-slate-400" />
            <span>Vehicles Operated:</span>
            <div className="flex gap-1">
              {data.vehiclesOperated.map((v) => (
                <span key={v} className="bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                  #{v}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Driver Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Working Days</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{data.totalWorkingDays} Days</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Unique working dates</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Total Trips</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{data.totalTrips}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Total Kiraya</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">Rs. {data.totalKiraya.toLocaleString()}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Total Kharcha</p>
            <p className="text-xl font-bold text-rose-700 mt-1">Rs. {data.totalKharcha.toLocaleString()}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Total Advance</p>
            <p className="text-xl font-bold text-amber-700 mt-1">Rs. {data.totalAdvance.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-xl shadow-md">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-emerald-400">Driver Baqaya</p>
            <p className="text-xl font-extrabold text-white mt-1">Rs. {data.driverBaqaya.toLocaleString()}</p>
            <p className="text-[9px] text-slate-300 mt-0.5">Kiraya - Kharcha - Advance</p>
          </div>
        </div>
      )}

      {/* Driver Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-800">
            Work History & Financial Ledger — Driver: {selectedDriver}
          </h3>
          <span className="text-xs text-slate-500">
            Calculated from verified Roznamcha entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[11px] tracking-wider font-semibold">
                <th className="py-3 px-3">Date (تاریخ)</th>
                <th className="py-3 px-3">Vehicle (گاڑی نمبر)</th>
                <th className="py-3 px-3">Maal (Material)</th>
                <th className="py-3 px-3 text-right">Diesel</th>
                <th className="py-3 px-3 text-right">Kiraya (کرایہ)</th>
                <th className="py-3 px-3 text-right">Kharcha (خرچہ)</th>
                <th className="py-3 px-3 text-right">Advance (پیشگی)</th>
                <th className="py-3 px-3 text-right">Entry Net</th>
                <th className="py-3 px-3 text-right">Running Baqaya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading driver ledger...
                  </td>
                </tr>
              ) : !data || data.records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No records found for driver {selectedDriver}.
                  </td>
                </tr>
              ) : (
                data.records.map((r) => (
                  <tr key={r.id} className="hover:bg-emerald-50/40 transition">
                    <td className="py-2.5 px-3 font-medium text-slate-700">{r.displayDate}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">#{r.gariNo}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.maal || "—"}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{r.dieselLiter > 0 ? `${r.dieselLiter} L` : "—"}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                      Rs. {r.kiraya.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-rose-700">
                      Rs. {r.kharcha.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-amber-700">
                      Rs. {r.advance.toLocaleString()}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-medium ${r.entryBaqaya >= 0 ? "text-slate-800" : "text-rose-600"}`}>
                      Rs. {r.entryBaqaya.toLocaleString()}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${r.runningBalance >= 0 ? "text-slate-900" : "text-rose-600"}`}>
                      Rs. {r.runningBalance.toLocaleString()}
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
