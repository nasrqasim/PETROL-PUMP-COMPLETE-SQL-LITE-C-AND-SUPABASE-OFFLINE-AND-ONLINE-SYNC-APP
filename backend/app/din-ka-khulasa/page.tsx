"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, Calendar, RefreshCw, Printer, ArrowRight } from "lucide-react";

interface DailyRecord {
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

interface DailySummaryResponse {
  date: string;
  displayDate: string;
  totalVehicles: number;
  totalTrips: number;
  totalKiraya: number;
  totalKharcha: number;
  totalAdvance: number;
  totalDiesel: number;
  totalBachat: number;
  records: DailyRecord[];
}

export default function DinKaKhulasaPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [summary, setSummary] = useState<DailySummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async (dateStr = selectedDate) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/daily?date=${encodeURIComponent(dateStr)}`);
      if (!res.ok) throw new Error("Failed to load daily summary from backend.");
      const data = await res.json();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || "Failed to load summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary(selectedDate);
  }, [selectedDate]);

  const handleTodayClick = () => {
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose-600" />
            Din Ka Khulasa — Daily Financial Summary & Overview
          </h2>
          <p className="text-sm text-slate-500">
            Daily financial snapshot showing operating vehicles, trips, freight, expenses, advances, and net Bachat.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Prominent Aaj Ka Total Button */}
          <button
            onClick={handleTodayClick}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-lg shadow transition"
          >
            <Calendar className="w-4 h-4" />
            <span>Aaj Ka Total (Today's Total)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Summary</span>
          </button>
        </div>
      </div>

      {/* Date Picker Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-bold text-slate-700">Select Date (تاریخ منتخب کریں):</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm font-semibold border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            onClick={() => loadSummary()}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
          >
            Load Date
          </button>
        </div>

        {summary && (
          <div className="text-xs text-slate-500 font-medium">
            Active Operating Vehicles: <strong className="text-slate-800">{summary.totalVehicles}</strong> | Trips:{" "}
            <strong className="text-slate-800">{summary.totalTrips}</strong>
          </div>
        )}
      </div>

      {/* Prominent Breakdown Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Vehicles Operating */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Vehicles</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">{summary.totalVehicles}</span>
              <span className="text-xs text-slate-400 font-medium">{summary.totalTrips} Trips</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Vehicles operating on this date</p>
          </div>

          {/* 2. Total Kiraya */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Kiraya (Freight)</span>
            <div className="mt-2">
              <span className="text-2xl font-black text-emerald-700">Rs. {summary.totalKiraya.toLocaleString()}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Total revenue / freight charges</p>
          </div>

          {/* 3. Total Kharcha */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Kharcha (Expenses)</span>
            <div className="mt-2">
              <span className="text-2xl font-black text-rose-700">Rs. {summary.totalKharcha.toLocaleString()}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Trip expenses & vehicle costs</p>
          </div>

          {/* 4. Total Advance */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Advance (Peshgi)</span>
            <div className="mt-2">
              <span className="text-2xl font-black text-amber-700">Rs. {summary.totalAdvance.toLocaleString()}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Advances paid to drivers</p>
          </div>

          {/* 5. Total Bachat */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-xl shadow-md border border-slate-700">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Total Bachat (Net Total)</span>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-white">Rs. {summary.totalBachat.toLocaleString()}</span>
            </div>
            <p className="text-[10px] text-slate-300 mt-1 font-mono">Kiraya - Kharcha - Advance</p>
          </div>
        </div>
      )}

      {/* Daily Detailed Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-800">
            Detailed Records — {summary?.displayDate || selectedDate}
          </h3>
          <span className="text-xs text-slate-500">
            Total records: {summary?.records.length || 0}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[11px] tracking-wider font-semibold">
                <th className="py-3 px-3">Gari No (گاڑی نمبر)</th>
                <th className="py-3 px-3">Driver (ڈرائیور)</th>
                <th className="py-3 px-3">Maal (Material)</th>
                <th className="py-3 px-3 text-right">Diesel</th>
                <th className="py-3 px-3 text-right">Kiraya (کرایہ)</th>
                <th className="py-3 px-3 text-right">Kharcha (خرچہ)</th>
                <th className="py-3 px-3 text-right">Advance (پیشگی)</th>
                <th className="py-3 px-3 text-right">Baqaya / Bachat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading daily summary records...
                  </td>
                </tr>
              ) : !summary || summary.records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No entries found for date {selectedDate}.
                  </td>
                </tr>
              ) : (
                summary.records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3">
                      <span className="inline-block bg-slate-100 text-slate-900 font-bold px-2 py-0.5 rounded border border-slate-200">
                        {r.gariNo}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{r.driverName}</td>
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
                    <td className={`py-2.5 px-3 text-right font-bold ${r.baqaya >= 0 ? "text-slate-900" : "text-rose-600"}`}>
                      Rs. {r.baqaya.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {summary && summary.records.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td className="py-3 px-3" colSpan={3}>
                    Grand Total ({summary.totalVehicles} Vehicles, {summary.totalTrips} Trips)
                  </td>
                  <td className="py-3 px-3 text-right font-mono">{summary.totalDiesel} L</td>
                  <td className="py-3 px-3 text-right text-emerald-800">
                    Rs. {summary.totalKiraya.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-rose-800">
                    Rs. {summary.totalKharcha.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-amber-800">
                    Rs. {summary.totalAdvance.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-slate-950">
                    Rs. {summary.totalBachat.toLocaleString()}
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
