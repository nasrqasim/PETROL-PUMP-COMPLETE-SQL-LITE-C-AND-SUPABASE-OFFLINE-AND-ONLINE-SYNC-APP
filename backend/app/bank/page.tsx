"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Building,
  CreditCard,
  Plus,
  Edit2,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search,
  Calendar,
  Share2,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  ChevronRight,
  Check,
  PowerOff,
  Filter,
} from "lucide-react";
import {
  createLedgerStatementImageBlob,
  shareOrDownloadWhatsApp,
} from "@/lib/whatsapp-image";

interface BankAccount {
  Id: number;
  BankName: string;
  AccountTitle: string;
  AccountNumber: string;
  BranchName?: string;
  OpeningBalance: number;
  CurrentBalance: number;
  Status: "Active" | "Inactive";
  Description?: string;
}

interface BankTransaction {
  Id: number;
  BankAccountId: number;
  Date: string;
  VoucherNumber: string;
  Description: string;
  TransactionType: string;
  BankIn: number;
  BankOut: number;
  RunningBalance: number;
  Reference?: string;
}

export default function BankManagementPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [accountDetails, setAccountDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters for ledger
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  // Modal: Add / Edit Bank Account
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    BankName: "",
    AccountTitle: "",
    AccountNumber: "",
    BranchName: "",
    OpeningBalance: "",
    Status: "Active" as "Active" | "Inactive",
    Description: "",
  });

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bank-accounts");
      if (!res.ok) throw new Error("Failed to load bank accounts.");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setAccounts(list);
      if (list.length > 0 && selectedAccountId === null) {
        setSelectedAccountId(list[0].Id);
      }
    } catch (err: any) {
      setError(err?.message || "Error loading bank accounts.");
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedAccountDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/bank-accounts/${id}`);
      if (!res.ok) throw new Error("Failed to load account ledger.");
      const data = await res.json();
      setAccountDetails(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      loadSelectedAccountDetails(selectedAccountId);
    }
  }, [selectedAccountId]);

  // Aggregate KPI Calculations
  const totalMoneyAllBanks = accounts.reduce((acc, curr) => acc + (curr.CurrentBalance || 0), 0);

  // Transactions of selected bank account
  const rawTx: BankTransaction[] = accountDetails?.transactions || [];

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

  const filteredTx = rawTx.filter((t) => {
    if (startDate && t.Date < startDate) return false;
    if (endDate && t.Date > endDate) return false;
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

  const periodBankIn = filteredTx.reduce((acc, curr) => acc + (curr.BankIn || 0), 0);
  const periodBankOut = filteredTx.reduce((acc, curr) => acc + (curr.BankOut || 0), 0);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      BankName: "",
      AccountTitle: "",
      AccountNumber: "",
      BranchName: "",
      OpeningBalance: "",
      Status: "Active",
      Description: "",
    });
    setShowModal(false);
  };

  const handleEdit = (b: BankAccount) => {
    setEditingId(b.Id);
    setForm({
      BankName: b.BankName,
      AccountTitle: b.AccountTitle,
      AccountNumber: b.AccountNumber,
      BranchName: b.BranchName || "",
      OpeningBalance: String(b.OpeningBalance),
      Status: b.Status,
      Description: b.Description || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.BankName.trim() || !form.AccountTitle.trim() || !form.AccountNumber.trim()) {
      alert("Please fill required bank details.");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingId ? `/api/bank-accounts/${editingId}` : "/api/bank-accounts";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to save bank account.");
      setSuccess(editingId ? "Bank account updated!" : "New bank account registered!");
      resetForm();
      loadAccounts();
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message || "Error saving bank account");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (account: BankAccount) => {
    const newStatus = account.Status === "Active" ? "Inactive" : "Active";
    if (!confirm(`Are you sure you want to change status of ${account.BankName} to ${newStatus}?`)) return;

    try {
      const res = await fetch(`/api/bank-accounts/${account.Id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Status: newStatus }),
      });
      if (res.ok) {
        setSuccess(`Account status changed to ${newStatus}`);
        loadAccounts();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      alert("Error changing status: " + err.message);
    }
  };

  // WhatsApp Share Handler
  const handleShareWhatsApp = async () => {
    const currentAcc = accounts.find((a) => a.Id === selectedAccountId);
    if (!currentAcc) return;

    try {
      const blob = await createLedgerStatementImageBlob({
        title: `${currentAcc.BankName} Statement`,
        subtitle: `A/C: ${currentAcc.AccountTitle} (${currentAcc.AccountNumber})`,
        partyName: `${currentAcc.BankName} — ${currentAcc.BranchName || "Commercial Branch"}`,
        partyPhone: "03152914836",
        dateRange: startDate && endDate ? `${startDate} to ${endDate}` : "Complete Period",
        openingBalance: currentAcc.CurrentBalance - periodBankIn + periodBankOut,
        totalIn: periodBankIn,
        totalOut: periodBankOut,
        closingBalance: currentAcc.CurrentBalance,
        transactions: filteredTx.map((t) => ({
          date: t.Date,
          voucher: t.VoucherNumber,
          desc: t.Description,
          inAmount: t.BankIn,
          outAmount: t.BankOut,
          balance: t.RunningBalance,
        })),
      });

      await shareOrDownloadWhatsApp({
        blob,
        filename: `Muslim-Construction-Bank-${currentAcc.BankName.replace(/\s+/g, "_")}-${new Date().toISOString().split("T")[0]}.png`,
        shareTitle: `${currentAcc.BankName} Statement`,
        shareText: `*Muslim Construction — ${currentAcc.BankName} Statement*\nA/C Title: ${currentAcc.AccountTitle}\nAccount #: ${currentAcc.AccountNumber}\nCurrent Balance: Rs. ${currentAcc.CurrentBalance.toLocaleString()}\n\nSoftware By Roonjha Developers : 03152914836`,
      });
    } catch (err: any) {
      alert("Error generating statement image: " + err.message);
    }
  };

  const activeAccount = accounts.find((a) => a.Id === selectedAccountId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-slate-700 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Building2 className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Bank Accounts Management
              </h1>
              <p className="text-xs text-amber-400 font-semibold mt-0.5">
                Corporate Banking • Client Online Deposits & Supplier Cheque Clearances
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2 max-w-xl">
            Manage multi-bank corporate accounts with chronological running ledgers. When recording payments or daily entries, select any bank to update balances automatically.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bank Account</span>
          </button>
          {activeAccount && (
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition"
              title="Share Bank Statement on WhatsApp as image"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Statement</span>
            </button>
          )}
          <button
            onClick={loadAccounts}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-600 transition"
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

      {/* Total Money in All Bank Accounts Summary Card */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
            Total Money in All Active Bank Accounts
          </span>
          <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">
            Rs. {totalMoneyAllBanks.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">
            Across {accounts.length} registered corporate banking accounts
          </span>
        </div>

        <div className="flex gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
            Active: {accounts.filter((a) => a.Status === "Active").length}
          </span>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
            Inactive: {accounts.filter((a) => a.Status === "Inactive").length}
          </span>
        </div>
      </div>

      {/* Bank Account Cards Grid */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
          <CreditCard className="w-4 h-4 text-amber-600" />
          Bank Accounts & Instant Selector
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((b) => {
            const isSelected = selectedAccountId === b.Id;
            return (
              <div
                key={b.Id}
                onClick={() => setSelectedAccountId(b.Id)}
                className={`p-4 rounded-2xl border transition cursor-pointer relative shadow-xs flex flex-col justify-between ${
                  isSelected
                    ? "bg-slate-900 text-white border-amber-500 ring-2 ring-amber-500/30"
                    : "bg-white text-slate-900 border-slate-200 hover:border-slate-300 hover:shadow"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-amber-400" : "text-slate-500"}`}>
                        {b.BankName}
                      </span>
                      <h4 className="font-bold text-sm mt-0.5 leading-snug">{b.AccountTitle}</h4>
                      <p className={`text-xs font-mono mt-1 ${isSelected ? "text-slate-300" : "text-slate-600"}`}>
                        {b.AccountNumber}
                      </p>
                      {b.BranchName && (
                        <p className={`text-[11px] ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                          {b.BranchName}
                        </p>
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.Status === "Active"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {b.Status}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100/20 flex justify-between items-end">
                  <div>
                    <span className={`text-[10px] block ${isSelected ? "text-slate-400" : "text-slate-400"}`}>
                      Current Balance
                    </span>
                    <span className={`text-lg font-black ${isSelected ? "text-emerald-400" : "text-emerald-700"}`}>
                      Rs. {b.CurrentBalance.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleEdit(b)}
                      className={`p-1.5 rounded-lg border text-xs font-bold transition ${
                        isSelected
                          ? "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                      title="Edit Account"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(b)}
                      className={`p-1.5 rounded-lg border text-xs font-bold transition ${
                        b.Status === "Active"
                          ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                          : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                      }`}
                      title={b.Status === "Active" ? "Deactivate" : "Activate"}
                    >
                      <PowerOff className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Bank Account Ledger */}
      {activeAccount && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-500" />
                <span>{activeAccount.BankName} — Transaction Ledger</span>
              </h3>
              <p className="text-xs text-slate-500">
                A/C Title: <strong>{activeAccount.AccountTitle}</strong> • Number: {activeAccount.AccountNumber}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Current Ledger Balance</span>
              <span className="text-xl font-black text-emerald-700">
                Rs. {activeAccount.CurrentBalance.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Date & Search Filter */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
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
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search description, voucher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
              />
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[11px] tracking-wider font-semibold">
                  <th className="py-3 px-3.5">Date</th>
                  <th className="py-3 px-3.5">Voucher #</th>
                  <th className="py-3 px-3.5">Description</th>
                  <th className="py-3 px-3.5">Type</th>
                  <th className="py-3 px-3.5 text-right text-emerald-400">Bank In (Deposit)</th>
                  <th className="py-3 px-3.5 text-right text-rose-400">Bank Out (Withdrawal)</th>
                  <th className="py-3 px-3.5 text-right">Running Bank Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTx.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No transactions recorded for this bank account yet.
                    </td>
                  </tr>
                ) : (
                  filteredTx.map((t) => (
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
                            t.BankIn > 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {t.TransactionType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-emerald-700 font-mono">
                        {t.BankIn > 0 ? `+ Rs. ${t.BankIn.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-rose-700 font-mono">
                        {t.BankOut > 0 ? `- Rs. ${t.BankOut.toLocaleString()}` : "—"}
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
      )}

      {/* Modal: Add / Edit Bank Account */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                {editingId ? "Edit Bank Account" : "Register New Bank Account"}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bank Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meezan Bank, HBL, Bank Alfalah, MCB"
                  value={form.BankName}
                  onChange={(e) => setForm({ ...form, BankName: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muslim Construction Fleet Operations"
                  value={form.AccountTitle}
                  onChange={(e) => setForm({ ...form, AccountTitle: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Number / IBAN *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0219-0103445892 or PK36MEZN..."
                  value={form.AccountNumber}
                  onChange={(e) => setForm({ ...form, AccountNumber: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Hub Chowki Branch"
                    value={form.BranchName}
                    onChange={(e) => setForm({ ...form, BranchName: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>

                {!editingId && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Opening Balance (Rs.)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 500000"
                      value={form.OpeningBalance}
                      onChange={(e) => setForm({ ...form, OpeningBalance: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Description</label>
                <input
                  type="text"
                  placeholder="e.g. Operational account for transport and fuel purchases"
                  value={form.Description}
                  onChange={(e) => setForm({ ...form, Description: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2 text-slate-600 border border-slate-300 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingId ? "Update Account" : "Register Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
