"use client";

import React, { useState, useEffect } from "react";
import { Truck, Printer, Calendar, User, Phone, CheckCircle } from "lucide-react";

interface VehicleLedgerRecord {
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

interface VehicleLedgerResponse {
  gariNo: string;
  driverName: string;
  malik: string;
  phone: string;
  totalTrips: number;
  totalKiraya: number;
  totalKharcha: number;
  totalAdvance: number;
  totalDiesel: number;
  baqaya: number;
  records: VehicleLedgerRecord[];
}

interface Gari {
  id: number;
  gariNo: string;
  driverName: string;
  malik: string;
  phone: string;
}

export default function GariWiseKhataPage() {
  const [gariyan, setGariyan] = useState<Gari[]>([]);
  const [selectedGariNo, setSelectedGariNo] = useState("786");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<VehicleLedgerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/gariyan")
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        if (Array.isArray(list)) {
          setGariyan(list);
          if (list.length > 0 && !selectedGariNo) {
            setSelectedGariNo(list[0].gariNo);
          }
        }
      })
      .catch(() => {});
  }, []);

  const loadLedger = async (vehicleNo = selectedGariNo) => {
    if (!vehicleNo) return;
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (startDate) q.append("startDate", startDate);
      if (endDate) q.append("endDate", endDate);

      const url = `/api/reports/vehicle/${encodeURIComponent(vehicleNo)}?${q.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load vehicle ledger.");
      const result = await res.json();
      
      const recordsList: VehicleLedgerRecord[] = Array.isArray(result?.records)
        ? result.records
        : Array.isArray(result?.entries)
        ? result.entries
        : [];

      setData({
        gariNo: result?.gariNo || vehicleNo,
        driverName: result?.driverName || (recordsList[0]?.driverName ?? ""),
        malik: result?.malik || "Apni",
        phone: result?.phone || "",
        totalTrips: Number(result?.totalTrips ?? recordsList.length),
        totalKiraya: Number(result?.totalKiraya ?? 0),
        totalKharcha: Number(result?.totalKharcha ?? 0),
        totalAdvance: Number(result?.totalAdvance ?? 0),
        totalDiesel: Number(result?.totalDiesel ?? result?.totalDieselLiter ?? 0),
        baqaya: Number(result?.baqaya ?? result?.totalBaqaya ?? 0),
        records: recordsList,
      });
    } catch (err: any) {
      setError(err?.message || "Could not fetch vehicle ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGariNo) {
      loadLedger(selectedGariNo);
    }
  }, [selectedGariNo]);

  const records = data?.records || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Gari Wise Khata — Vehicle Financial Ledger
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Individual vehicle ledger showing trips, total freight earnings, trip expenses, advances, and net Baqaya.
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

      {/* Filter and Gari Selection Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Vehicle Dropdown */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-700">Vehicle (گاڑی):</label>
            <select
              value={selectedGariNo}
              onChange={(e) => setSelectedGariNo(e.target.value)}
              className="text-sm font-bold border border-slate-300 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {gariyan.map((g) => (
                <option key={g.id} value={g.gariNo}>
                  #{g.gariNo} — {g.driverName || "Driver"} ({g.malik})
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Or type Gari No"
              value={selectedGariNo}
              onChange={(e) => setSelectedGariNo(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase"
            />
          </div>

          {/* Date Range */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-500 font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => loadLedger()}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-xl shadow-sm transition"
            >
              Filter
            </button>
          </div>
        </div>

        {data && (
          <div className="text-xs text-slate-600 flex items-center space-x-3">
            <span>Driver: <strong className="text-slate-900">{data.driverName || "Assigned"}</strong></span>
            <span>Type: <strong className="text-slate-900">{data.malik}</strong></span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Ledger Summary Metrics */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Total Trips</span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900">{data.totalTrips}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Vehicle operations count</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Total Kiraya</span>
            <div className="mt-2">
              <span className="text-lg sm:text-2xl font-black text-emerald-700">
                Rs. {Number(data.totalKiraya || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Total revenue generated</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Total Kharcha</span>
            <div className="mt-2">
              <span className="text-lg sm:text-2xl font-black text-rose-700">
                Rs. {Number(data.totalKharcha || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Trip expenses & fuel</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Total Advance</span>
            <div className="mt-2">
              <span className="text-lg sm:text-2xl font-black text-amber-700">
                Rs. {Number(data.totalAdvance || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Advances paid on route</p>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-slate-700">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400">Total Baqaya (Net)</span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-white">
                Rs. {Number(data.baqaya || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-[9px] text-slate-300 mt-1 font-mono">Net remaining earnings</p>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-800">
            Trip Transactions Ledger — Vehicle #{data?.gariNo || selectedGariNo}
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
                <th className="py-3 px-3">Driver (ڈرائیور)</th>
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
                    Loading vehicle ledger...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No transactions found for vehicle #{selectedGariNo} in selected date range.
                  </td>
                </tr>
              ) : (
                records.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-medium text-slate-700">{row.displayDate || row.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{row.driverName}</td>
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
                    Totals ({data.totalTrips} Trips)
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
                    Closing Baqaya: Rs. {Number(data.baqaya || 0).toLocaleString()}
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
