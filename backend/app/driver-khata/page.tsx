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
  const [selectedDriver, setSelectedDriver] = useState("Iqbal Driver");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<DriverLedgerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Discover drivers from entries and registered vehicles
  useEffect(() => {
    Promise.all([fetch("/api/roznamcha"), fetch("/api/gariyan")])
      .then(async ([rozRes, gariRes]) => {
        const roz = rozRes.ok ? await rozRes.json().catch(() => []) : [];
        const gari = gariRes.ok ? await gariRes.json().catch(() => []) : [];
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
      
      const recordsList: DriverLedgerRecord[] = Array.isArray(result?.records)
        ? result.records
        : Array.isArray(result?.entries)
        ? result.entries
        : [];

      const vehicles = Array.isArray(result?.vehiclesOperated)
        ? result.vehiclesOperated
        : Array.from(new Set(recordsList.map((r) => r.gariNo)));

      setData({
        driverName: result?.driverName || driverName,
        totalWorkingDays: Number(result?.totalWorkingDays ?? new Set(recordsList.map((r) => r.date)).size),
        totalTrips: Number(result?.totalTrips ?? recordsList.length),
        vehiclesOperated: vehicles,
        totalKiraya: Number(result?.totalKiraya ?? 0),
        totalKharcha: Number(result?.totalKharcha ?? 0),
        totalAdvance: Number(result?.totalAdvance ?? 0),
        totalDiesel: Number(result?.totalDiesel ?? result?.totalDieselLiter ?? 0),
        driverBaqaya: Number(result?.driverBaqaya ?? result?.totalBaqaya ?? 0),
        records: recordsList,
      });
    } catch (err: any) {
      setError(err?.message || "Could not fetch driver ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDriver) {
      loadDriverLedger(selectedDriver);
    }
  }, [selectedDriver]);

  const records = data?.records || [];
  const vehicles = data?.vehiclesOperated || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            Driver Wise Khata — Complete Driver Financial Ledger
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Individual driver ledger showing all trips, Kiraya generated, expenses, advances, and remaining balance.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => window.print()}
            className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Ledger</span>
          </button>
        </div>
      </div>

      {/* Filter and Driver Selection Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Driver Dropdown & Text */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-700">Driver:</label>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="text-sm font-semibold border border-slate-300 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 w-32 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Date Range */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-xs text-slate-500 font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={() => loadDriverLedger()}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-xl shadow-sm transition"
            >
              Filter
            </button>
          </div>
        </div>

        {data && (
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-slate-400" />
            <span>Vehicles:</span>
            <div className="flex gap-1">
              {vehicles.map((v) => (
                <span key={v} className="bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                  #{v}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Driver Ledger Summary Metrics */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Working Days</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-slate-900">{data.totalWorkingDays}</span>
              <span className="text-[11px] text-slate-400 font-medium">{data.totalTrips} Trips</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Days on road</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Total Kiraya</span>
            <div className="mt-2">
              <span className="text-lg sm:text-2xl font-black text-emerald-700">
                Rs. {Number(data.totalKiraya || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Total transport freight</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Total Kharcha</span>
            <div className="mt-2">
              <span className="text-lg sm:text-2xl font-black text-rose-700">
                Rs. {Number(data.totalKharcha || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Trip expenses paid</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Total Advance</span>
            <div className="mt-2">
              <span className="text-lg sm:text-2xl font-black text-amber-700">
                Rs. {Number(data.totalAdvance || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Cash advances taken</p>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-slate-700">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400">Driver Baqaya (Net)</span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-white">
                Rs. {Number(data.driverBaqaya || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-[9px] text-slate-300 mt-1 font-mono">Net remaining balance</p>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-800">
            Trip Transactions Ledger — {data?.driverName || selectedDriver}
          </h3>
          <span className="text-xs text-slate-500">
            Total entries: {records.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[11px] tracking-wider font-semibold">
                <th className="py-3 px-3">Date (تاریخ)</th>
                <th className="py-3 px-3">Gari No (گاڑی)</th>
                <th className="py-3 px-3">Maal (Material)</th>
                <th className="py-3 px-3 text-right">Diesel</th>
                <th className="py-3 px-3 text-right">Kiraya (کرایہ)</th>
                <th className="py-3 px-3 text-right">Kharcha (خرچہ)</th>
                <th className="py-3 px-3 text-right">Advance (پیشگی)</th>
                <th className="py-3 px-3 text-right">Entry Baqaya</th>
                <th className="py-3 px-3 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading driver ledger...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No transactions found for this driver in selected date range.
                  </td>
                </tr>
              ) : (
                records.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-medium text-slate-700">{row.displayDate || row.date}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block bg-slate-100 text-slate-900 font-bold px-2 py-0.5 rounded border border-slate-200">
                        {row.gariNo}
                      </span>
                    </td>
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
                    <td className={`py-2.5 px-3 text-right font-bold ${row.entryBaqaya >= 0 ? "text-slate-800" : "text-rose-600"}`}>
                      Rs. {Number(row.entryBaqaya || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900">
                      Rs. {Number(row.runningBalance || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {data && records.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td className="py-3 px-3" colSpan={3}>
                    Totals ({data.totalTrips} Trips, {data.totalWorkingDays} Working Days)
                  </td>
                  <td className="py-3 px-3 text-right font-mono">{data.totalDiesel} L</td>
                  <td className="py-3 px-3 text-right text-emerald-800">
                    Rs. {Number(data.totalKiraya || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-rose-800">
                    Rs. {Number(data.totalKharcha || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-amber-800">
                    Rs. {Number(data.totalAdvance || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-800" colSpan={2}>
                    Closing Baqaya: Rs. {Number(data.driverBaqaya || 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
