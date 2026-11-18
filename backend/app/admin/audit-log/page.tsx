"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Printer,
  ArrowLeft,
  Clock,
  User,
  Activity,
  Layers,
  FileText,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface AuditLog {
  id: string;
  timestamp: string;
  username: string;
  module: string;
  action: string;
  recordId?: string | number;
  details: string;
  reference?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (moduleFilter !== "all") params.set("module", moduleFilter);
      if (actionFilter !== "all") params.set("action", actionFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter, actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("PAYMENT") || act.includes("RECEIPT")) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
          {action}
        </span>
      );
    }
    if (act.includes("DELETE")) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
          {action}
        </span>
      );
    }
    if (act.includes("UPDATE") || act.includes("BRANDING")) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
          {action}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Print-only Header */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4">
        <h1 className="text-xl font-black uppercase">Muslim Construction ERP</h1>
        <p className="text-xs text-slate-700">Financial & Security Audit Log Statement</p>
        <p className="text-[10px] text-slate-500 font-bold mt-1">
          Generated: {new Date().toLocaleString("en-GB")} | Software By Roonjha Developers : 03152914836
        </p>
      </div>

      {/* Top Bar / Breadcrumb */}
      <div className="print:hidden bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-900 text-amber-400">
                Super Admin
              </span>
              <h1 className="text-base sm:text-lg font-black text-slate-900">
                System Audit & Financial Log
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Immutable trail of customer receipts, supplier disbursements, voucher postings, and admin settings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => window.print()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Log</span>
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="print:hidden grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Logged Events
          </span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            {logs.length}
          </span>
          <span className="text-[10px] text-slate-500">Full tamper-evident trail</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Financial Transactions
          </span>
          <span className="text-xl font-black text-emerald-700 mt-1 block">
            {logs.filter((l) => l.action.toLowerCase().includes("payment") || l.action.toLowerCase().includes("voucher") || l.action.toLowerCase().includes("receipt")).length}
          </span>
          <span className="text-[10px] text-slate-500">Cash, Bank & Ledger ops</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Trip Charges
          </span>
          <span className="text-xl font-black text-blue-700 mt-1 block">
            {logs.filter((l) => l.action.toLowerCase().includes("trip")).length}
          </span>
          <span className="text-[10px] text-slate-500">Roznamcha freight debit</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Config & Security
          </span>
          <span className="text-xl font-black text-amber-700 mt-1 block">
            {logs.filter((l) => l.module.toLowerCase().includes("company") || l.module.toLowerCase().includes("security") || l.module.toLowerCase().includes("trial")).length}
          </span>
          <span className="text-[10px] text-slate-500">Admin credentials & profile</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="print:hidden bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit details, reference, user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Module:</span>
          </div>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-2.5 py-2 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Modules</option>
            <option value="Customers">Customers</option>
            <option value="Suppliers">Suppliers</option>
            <option value="Daily Ledger">Daily Ledger (Roznamcha)</option>
            <option value="Vouchers">Vouchers</option>
            <option value="Company Profile">Company Profile</option>
            <option value="Security">Security & Access</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold ml-2">
            <span>Action:</span>
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-2.5 py-2 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Actions</option>
            <option value="PAYMENT">Payments & Receipts</option>
            <option value="TRIP_CHARGE">Trip Charges</option>
            <option value="VOUCHER_CREATE">Voucher Create</option>
            <option value="BRANDING_UPDATE">Branding Update</option>
            <option value="DELETE">Deletions</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">User</th>
                <th className="py-3 px-3">Module</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Record / Ref</th>
                <th className="py-3 px-4">Details & Financial Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading audit trail records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No audit records found matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(log.timestamp).toLocaleString("en-GB")}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <User className="w-3 h-3 text-amber-500" />
                        {log.username}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="text-[11px] font-mono font-bold text-slate-800">
                        {log.reference || `#${log.recordId || "SYS"}`}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="text-xs font-medium">{log.details}</div>
                      {log.newValues && (
                        <div className="text-[10px] text-slate-500 mt-1 font-mono bg-slate-50 p-1.5 rounded border border-slate-100">
                          {Object.entries(log.newValues)
                            .slice(0, 4)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" | ")}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Credit */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500 font-bold">
          Software By Roonjha Developers : 03152914836
        </div>
      </div>
    </div>
  );
}
