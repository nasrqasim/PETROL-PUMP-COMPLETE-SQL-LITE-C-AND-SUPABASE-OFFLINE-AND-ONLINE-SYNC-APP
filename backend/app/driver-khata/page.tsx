"use client";

import React, { useState, useEffect } from "react";
import { UserCheck, Printer, Calendar, Truck, Clock, Download } from "lucide-react";

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
        if (list.length > 0) {
          setDrivers(list);
          if (!selectedDriver) {
            setSelectedDriver(list[0]);
          }
        }
      })
      .catch(() => {});
  }, []);

  const loadLedger = async (driver = selectedDriver) => {
    if (!driver) return;
    setLoading(true);
    setError(null);
    try {
      let url = `/api/reports/driver/${encodeURIComponent(driver)}`;
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const q = params.toString();
      if (q) url += `?${q}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Could not load driver ledger");
      const d = await res.json();
      
      const recordsList: DriverLedgerRecord[] = Array.isArray(d?.records)
        ? d.records
        : Array.isArray(d?.entries)
        ? d.entries
        : [];

      const normalized: DriverLedgerResponse = {
        driverName: d?.driverName || driver,
        totalWorkingDays: Number(d?.totalWorkingDays ?? 0),
        totalTrips: Number(d?.totalTrips ?? recordsList.length),
        vehiclesOperated: Array.isArray(d?.vehiclesOperated) ? d.vehiclesOperated : [],
        totalKiraya: Number(d?.totalKiraya ?? 0),
        totalKharcha: Number(d?.totalKharcha ?? 0),
        totalAdvance: Number(d?.totalAdvance ?? 0),
        totalDiesel: Number(d?.totalDiesel ?? d?.totalDieselLiter ?? 0),
        driverBaqaya: Number(d?.driverBaqaya ?? d?.totalBaqaya ?? 0),
        records: recordsList,
      };

      setData(normalized);
    } catch (err: any) {
      setError(err?.message || "Could not fetch driver ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDriver) {
      loadLedger(selectedDriver);
    }
  }, [selectedDriver]);

  const handlePrintLedger = () => {
    document.body.classList.remove("printing-thermal");
    window.print();
  };

  const handleDownloadLedger = () => {
    if (!data || data.records.length === 0) return;
    const headers = ["Date", "Gari No", "Maal", "Diesel (Ltr)", "Kiraya (Rs)", "Kharcha (Rs)", "Advance (Rs)", "Entry Baqaya (Rs)", "Running Balance (Rs)"];
    const rows = data.records.map((r) => [
      `"${r.displayDate || r.date}"`,
      `"${r.gariNo}"`,
      `"${r.maal || ""}"`,
      r.dieselLiter,
      r.kiraya,
      r.kharcha,
      r.advance,
      r.entryBaqaya,
      r.runningBalance,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Muslim-Construction-Driver-Ledger-${selectedDriver}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const records = data?.records || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            Driver Wise Khata — Muslim Construction Driver Financial Statement
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Individual driver ledger showing operating days, assigned vehicles, freight, expenses, advances, and remaining balance.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleDownloadLedger}
            className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Whole Ledger</span>
          </button>

          <button
            onClick={handlePrintLedger}
            className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Ledger</span>
          </button>
        </div>
      </div>

      {/* Driver Selection & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between no-print">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-700">Driver:</label>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="text-sm font-bold border border-slate-300 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {drivers.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Or type Driver"
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="text-sm border border-slate-300 rounded-xl px-3 py-1.5 w-36 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs font-medium text-slate-600">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5"
            />
            <label className="text-xs font-medium text-slate-600">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5"
            />
            <button
              onClick={() => loadLedger()}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-white font-semibold px-3 py-1.5 rounded-xl shadow-sm transition"
            >
              Filter
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs no-print">
          {error}
        </div>
      )}

      {/* PRINT AREA CONTAINER */}
      <div id="print-area" className="space-y-6">
        {/* Printable Official Header */}
        <div className="hidden print:block pb-4 mb-4 border-b-2 border-slate-900">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-slate-950 tracking-tight">MUSLIM CONSTRUCTION</h1>
              <p className="text-xs text-slate-600">Driver Ledger Account Statement</p>
              <p className="text-xs font-bold text-slate-800 mt-1">
                Driver Name: {data?.driverName || selectedDriver} | Total Working Days: {data?.totalWorkingDays}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-slate-100 text-slate-900 font-bold px-3 py-1 rounded border border-slate-300 text-xs">
                DRIVER LEDGER
              </span>
              <p className="text-[10px] text-slate-500 mt-1">Printed: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Driver Summary Card */}
        {data && (
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 rounded-2xl shadow-lg border border-slate-700 print:bg-white print:text-black print:border-2 print:border-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 print:text-slate-600">Driver Account</span>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2 mt-0.5 print:text-slate-950">
                  <span>{data.driverName}</span>
                </h3>
                <div className="flex flex-wrap gap-4 text-xs text-slate-300 print:text-slate-700 mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400 print:text-slate-700" /> Working Days: <strong>{data.totalWorkingDays} Days</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-sky-400 print:text-slate-700" /> Total Trips: <strong>{data.totalTrips} Trips</strong>
                  </span>
                  {data.vehiclesOperated && data.vehiclesOperated.length > 0 && (
                    <span>Vehicles: {data.vehiclesOperated.join(", ")}</span>
                  )}
                </div>
              </div>

              {/* Net Balance Pill */}
              <div className="bg-white/10 print:bg-slate-100 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 print:border-slate-300 text-right w-full md:w-auto">
                <span className="text-[10px] sm:text-xs text-slate-300 print:text-slate-600 uppercase font-semibold block">
                  Driver Closing Baqaya
                </span>
                <span className={`text-2xl sm:text-3xl font-black ${data.driverBaqaya >= 0 ? "text-emerald-400 print:text-slate-950" : "text-rose-400"}`}>
                  Rs. {Number(data.driverBaqaya || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700/80 print:border-slate-300 text-center">
              <div>
                <span className="text-[10px] uppercase text-slate-400 print:text-slate-600 block">Total Freight (Kiraya)</span>
                <span className="text-base font-bold text-emerald-400 print:text-emerald-700">Rs. {Number(data.totalKiraya || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 print:text-slate-600 block">Total Kharcha</span>
                <span className="text-base font-bold text-rose-400 print:text-rose-700">Rs. {Number(data.totalKharcha || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 print:text-slate-600 block">Total Advance Paid</span>
                <span className="text-base font-bold text-amber-400 print:text-amber-700">Rs. {Number(data.totalAdvance || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 print:text-slate-600 block">Total Diesel</span>
                <span className="text-base font-bold text-sky-400 print:text-sky-700 font-mono">{data.totalDiesel} L</span>
              </div>
            </div>
          </div>
        )}

        {/* Ledger Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center print:bg-transparent">
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
                <tr className="bg-slate-900 text-white uppercase text-[11px] tracking-wider font-semibold print:bg-slate-200 print:text-black">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Vehicle Number</th>
                  <th className="py-3 px-3">Material</th>
                  <th className="py-3 px-3 text-right">Diesel</th>
                  <th className="py-3 px-3 text-right">Freight (Kiraya)</th>
                  <th className="py-3 px-3 text-right">Expenses (Kharcha)</th>
                  <th className="py-3 px-3 text-right">Advance Paid</th>
                  <th className="py-3 px-3 text-right">Entry Balance</th>
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

        {/* Printed Footer Required by User */}
        <div className="hidden print:block text-center pt-6 mt-6 border-t border-slate-300">
          <p className="font-bold text-xs text-slate-800">Muslim Construction - Roznamcha Software</p>
          <p className="font-bold text-xs text-slate-600">Software By Roonjha Developers: 03152914836</p>
        </div>
      </div>
    </div>
  );
}
