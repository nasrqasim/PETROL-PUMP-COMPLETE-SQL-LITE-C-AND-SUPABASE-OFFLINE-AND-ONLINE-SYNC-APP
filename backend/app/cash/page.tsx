"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Search,
  RefreshCw,
  Plus,
  Share2,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Building,
  Users,
  Truck,
  HardHat,
  Filter,
} from "lucide-react";
import {
  createLedgerStatementImageBlob,
  shareOrDownloadWhatsApp,
} from "@/lib/whatsapp-image";

interface CashTransaction {
  Id: number;
  Date: string;
  VoucherNumber: string;
  Description: string;
  Reference?: string;
  TransactionType: string;
  CashIn: number;
  CashOut: number;
  RunningBalance: number;
}

export default function CashManagementPage() {
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Summaries
  const [currentBalance, setCurrentBalance] = useState(0);
  const [totalCashIn, setTotalCashIn] = useState(0);
  const [totalCashOut, setTotalCashOut] = useState(0);
  const [todayCashIn, setTodayCashIn] = useState(0);
  const [todayCashOut, setTodayCashOut] = useState(0);

  // Filters
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  // New Cash Voucher Modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    VoucherType: "CashReceipt",
    TransactionType: "Customer Receipt",
    Amount: "",
    Remarks: "",
    Reference: "",
  });

  const loadCashData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cash");
      if (!res.ok) throw new Error("Failed to load cash ledger.");
      const data = await res.json();
      setCurrentBalance(data.currentBalance || 0);
      setTotalCashIn(data.totalCashIn || 0);
      setTotalCashOut(data.totalCashOut || 0);
      setTodayCashIn(data.todayCashIn || 0);
      setTodayCashOut(data.todayCashOut || 0);
      setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load cash management data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashData();
  }, []);

  // Quick Date Preset Handler
  const handleDatePreset = (preset: string) => {
    setDateFilter(preset);
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "yesterday") {
      const yest = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      setStartDate(yest);
      setEndDate(yest);
    } else if (preset === "week") {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      setStartDate(weekAgo);
      setEndDate(todayStr);
    } else if (preset === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
      setStartDate(firstDay);
      setEndDate(todayStr);
    } else if (preset === "last_month") {
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split("T")[0];
      const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split("T")[0];
      setStartDate(firstDayLastMonth);
      setEndDate(lastDayLastMonth);
    } else {
      setStartDate("");
      setEndDate("");
    }
  };

  // Filtered Ledger
  const filtered = transactions.filter((t) => {
    if (startDate && t.Date < startDate) return false;
    if (endDate && t.Date > endDate) return false;
    if (typeFilter !== "all" && t.TransactionType !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        t.Description.toLowerCase().includes(q) ||
        t.VoucherNumber.toLowerCase().includes(q) ||
        t.TransactionType.toLowerCase().includes(q) ||
        (t.Reference && t.Reference.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const periodIn = filtered.reduce((acc, curr) => acc + (curr.CashIn || 0), 0);
  const periodOut = filtered.reduce((acc, curr) => acc + (curr.CashOut || 0), 0);

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(form.Amount) || 0;
    if (amt <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          PaymentType: form.VoucherType,
          PartyType: "General",
          Amount: amt,
          Remarks: form.Remarks || form.TransactionType,
        }),
      });

      if (!res.ok) throw new Error("Failed to save cash transaction.");

      setSuccess("Cash voucher recorded successfully!");
      setShowModal(false);
      setForm({
        VoucherType: "CashReceipt",
        TransactionType: "Customer Receipt",
        Amount: "",
        Remarks: "",
        Reference: "",
      });
      loadCashData();
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message || "Error saving transaction");
    } finally {
      setSubmitting(false);
    }
  };

  // WhatsApp Share Handler
  const handleShareWhatsApp = async () => {
    try {
      const blob = await createLedgerStatementImageBlob({
        title: "Cash in Hand Management Ledger",
        subtitle: "Muslim Construction Fleet & Site Cash Inflow / Outflow",
        partyName: "Company Cash Account",
        partyPhone: "03152914836",
        dateRange: startDate && endDate ? `${startDate} to ${endDate}` : "Complete Period",
        openingBalance: currentBalance - periodIn + periodOut,
        totalIn: periodIn,
        totalOut: periodOut,
        closingBalance: currentBalance,
        transactions: filtered.map((t) => ({
          date: t.Date,
          voucher: t.VoucherNumber,
          desc: t.Description,
          inAmount: t.CashIn,
          outAmount: t.CashOut,
          balance: t.RunningBalance,
        })),
      });

      await shareOrDownloadWhatsApp({
        blob,
        filename: `Muslim-Construction-Cash-Ledger-${new Date().toISOString().split("T")[0]}.png`,
        shareTitle: "Muslim Construction Cash Ledger Statement",
        shareText: `*Muslim Construction — Cash Ledger Statement*\nPeriod: ${startDate || "All"} to ${endDate || "Today"}\nTotal Cash In: Rs. ${periodIn.toLocaleString()}\nTotal Cash Out: Rs. ${periodOut.toLocaleString()}\nCurrent Cash Balance: Rs. ${currentBalance.toLocaleString()}\n\nSoftware By Roonjha Developers : 03152914836`,
      });
    } catch (err: any) {
      alert("Error sharing image: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-slate-700 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Wallet className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Cash Management & Treasury
              </h1>
              <p className="text-xs text-amber-400 font-semibold mt-0.5">
                Physical Cash in Hand • Real-Time Daily Roznamcha & Expense Cashflow
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2 max-w-xl">
            Live cash balance tracking synchronized with customer cash receipts, driver trip advances, supplier cash clearances, and site labour disbursements.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record Cash Entry</span>
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition"
            title="Share Cash Statement on WhatsApp as image"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share on WhatsApp</span>
          </button>
          <button
            onClick={loadCashData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-600 transition"
            title="Refresh Cash"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Notice</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl flex items-start gap-2.5 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Success</p>
            <p>{success}</p>
          </div>
        </div>
      )}

      {/* Top 5 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Total Cash Balance */}
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-slate-900 to-slate-950 text-white p-4 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
            Current Cash in Hand
          </span>
          <span className="text-xl sm:text-2xl font-black text-white mt-1 block">
            Rs. {currentBalance.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400">Total liquid cash available</span>
        </div>

        {/* Card 2: Total Cash In */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Total Cash In (All-Time)
          </span>
          <span className="text-lg sm:text-xl font-black text-emerald-600 mt-1 block">
            Rs. {totalCashIn.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" /> Total cash inflows
          </span>
        </div>

        {/* Card 3: Total Cash Out */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Total Cash Out (All-Time)
          </span>
          <span className="text-lg sm:text-xl font-black text-rose-600 mt-1 block">
            Rs. {totalCashOut.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <ArrowDownRight className="w-3 h-3 text-rose-500" /> Disbursed expenses
          </span>
        </div>

        {/* Card 4: Today's Cash In */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Today&apos;s Cash In
          </span>
          <span className="text-lg sm:text-xl font-black text-emerald-700 mt-1 block">
            Rs. {todayCashIn.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400">Receipts today</span>
        </div>

        {/* Card 5: Today's Cash Out */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Today&apos;s Cash Out
          </span>
          <span className="text-lg sm:text-xl font-black text-rose-700 mt-1 block">
            Rs. {todayCashOut.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400">Disbursed today</span>
        </div>
      </div>

      {/* Universal Date & Search Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Preset Date Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] font-bold mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-500" /> Date:
            </span>
            {[
              { id: "all", label: "All Time" },
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "week", label: "Last 7 Days" },
              { id: "month", label: "This Month" },
              { id: "last_month", label: "Last Month" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleDatePreset(p.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  dateFilter === p.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search narration, voucher #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Custom Date Range Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs items-center">
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDateFilter("custom");
              }}
              className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1.5"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDateFilter("custom");
              }}
              className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1.5"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Transaction Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white"
            >
              <option value="all">All Types</option>
              <option value="Customer Receipt">Customer Receipt</option>
              <option value="Supplier Payment">Supplier Payment</option>
              <option value="Staff Payment">Staff Payment</option>
              <option value="Vehicle Expense">Vehicle Expense</option>
              <option value="Expense">General Expense</option>
              <option value="Other Income">Other Income</option>
            </select>
          </div>
          <div className="text-right pt-3">
            <span className="text-[11px] text-slate-500 block">
              Period In: <strong className="text-emerald-700">Rs. {periodIn.toLocaleString()}</strong>
            </span>
            <span className="text-[11px] text-slate-500 block">
              Period Out: <strong className="text-rose-700">Rs. {periodOut.toLocaleString()}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Cash Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-sm text-slate-800">
              Cash Transactions Ledger
            </h3>
            <span className="text-xs text-slate-500">
              Showing {filtered.length} entries
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-700">Formula: </span>
            <span className="text-xs font-mono text-slate-600">
              Closing = Opening + Cash In - Cash Out
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[11px] tracking-wider font-semibold">
                <th className="py-3 px-3.5">Date</th>
                <th className="py-3 px-3.5">Voucher #</th>
                <th className="py-3 px-3.5">Description / Narration</th>
                <th className="py-3 px-3.5">Type</th>
                <th className="py-3 px-3.5 text-right text-emerald-400">Cash In (Receipt)</th>
                <th className="py-3 px-3.5 text-right text-rose-400">Cash Out (Payment)</th>
                <th className="py-3 px-3.5 text-right">Running Cash Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading cash ledger records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No cash transactions found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.Id} className="hover:bg-amber-50/40 transition">
                    <td className="py-2.5 px-3.5 font-medium text-slate-700 whitespace-nowrap">
                      {t.Date}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-bold border border-slate-200">
                        {t.VoucherNumber}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-800 font-medium">
                      <div>{t.Description}</div>
                      {t.Reference && (
                        <div className="text-[10px] text-slate-400">Ref: {t.Reference}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.CashIn > 0
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {t.TransactionType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-emerald-700 font-mono">
                      {t.CashIn > 0 ? `+ Rs. ${t.CashIn.toLocaleString()}` : "—"}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-rose-700 font-mono">
                      {t.CashOut > 0 ? `- Rs. ${t.CashOut.toLocaleString()}` : "—"}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-black text-slate-900 font-mono text-sm">
                      Rs. {t.RunningBalance.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Quick Cash Transaction Entry */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-500" />
                Record Cash Transaction
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Transaction Nature *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, VoucherType: "CashReceipt" })}
                    className={`py-2 rounded-xl font-bold border transition ${
                      form.VoucherType === "CashReceipt"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    + Cash Receipt (Inflow)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, VoucherType: "CashPayment" })}
                    className={`py-2 rounded-xl font-bold border transition ${
                      form.VoucherType === "CashPayment"
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    - Cash Payment (Outflow)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category / Type *</label>
                <select
                  value={form.TransactionType}
                  onChange={(e) => setForm({ ...form, TransactionType: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white"
                >
                  <option value="Customer Receipt">Customer Cash Receipt</option>
                  <option value="Supplier Payment">Supplier Cash Payment</option>
                  <option value="Staff Payment">Staff Salary / Advance</option>
                  <option value="Vehicle Expense">Vehicle Cash Expense</option>
                  <option value="Expense">General Site Expense</option>
                  <option value="Other Income">Other Income</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount (Rs.) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 25000"
                  value={form.Amount}
                  onChange={(e) => setForm({ ...form, Amount: e.target.value })}
                  className="w-full text-sm font-bold border border-amber-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Narration / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Received from customer or site labour wages"
                  value={form.Remarks}
                  onChange={(e) => setForm({ ...form, Remarks: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 text-slate-600 border border-slate-300 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Cash Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
