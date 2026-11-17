"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Receipt,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Truck,
  User,
  Plus,
  CheckCircle,
  X,
  Trash2,
  Edit2,
  Printer,
  Share2,
  Building,
  Users,
  HardHat,
  CreditCard,
  Wallet,
  Building2,
} from "lucide-react";
import {
  createLedgerStatementImageBlob,
  shareOrDownloadWhatsApp,
} from "@/lib/whatsapp-image";
import { printTableDocument } from "@/lib/print-table";

export default function CashBankPage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [gariyan, setGariyan] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    PaymentType: "CashPayment",
    PartyType: "Customer",
    CustomerId: "",
    SupplierId: "",
    StaffId: "",
    BankAccountId: "",
    GariNo: "",
    DriverName: "",
    Amount: "",
    Remarks: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [vRes, cRes, sRes, stRes, gRes, bRes] = await Promise.all([
        fetch("/api/vouchers"),
        fetch("/api/customers"),
        fetch("/api/suppliers"),
        fetch("/api/staff"),
        fetch("/api/gariyan"),
        fetch("/api/bank-accounts"),
      ]);

      const [vData, cData, sData, stData, gData, bData] = await Promise.all([
        vRes.ok ? vRes.json().catch(() => []) : [],
        cRes.ok ? cRes.json().catch(() => []) : [],
        sRes.ok ? sRes.json().catch(() => []) : [],
        stRes.ok ? stRes.json().catch(() => []) : [],
        gRes.ok ? gRes.json().catch(() => []) : [],
        bRes.ok ? bRes.json().catch(() => []) : [],
      ]);

      setVouchers(Array.isArray(vData) ? vData : []);
      setCustomers(Array.isArray(cData) ? cData : []);
      setSuppliers(Array.isArray(sData) ? sData : []);
      setStaffList(Array.isArray(stData) ? stData : []);
      setGariyan(Array.isArray(gData) ? gData : []);
      setBankAccounts(Array.isArray(bData) ? bData : []);
    } catch (err) {
      console.error("Failed to load cash/bank data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      PaymentType: "CashPayment",
      PartyType: "Customer",
      CustomerId: "",
      SupplierId: "",
      StaffId: "",
      BankAccountId: "",
      GariNo: "",
      DriverName: "",
      Amount: "",
      Remarks: "",
    });
    setShowModal(false);
  };

  const handleEdit = (v: any) => {
    setEditingId(v.Id);
    setForm({
      PaymentType: v.PaymentType || "CashPayment",
      PartyType: v.PartyType || "Customer",
      CustomerId: v.CustomerId ? String(v.CustomerId) : "",
      SupplierId: v.SupplierId ? String(v.SupplierId) : "",
      StaffId: v.StaffId ? String(v.StaffId) : "",
      BankAccountId: v.BankAccountId ? String(v.BankAccountId) : "",
      GariNo: v.GariNo || "",
      DriverName: v.DriverName || "",
      Amount: String(v.Amount || ""),
      Remarks: v.Remarks || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(form.Amount);
    if (!amt || amt <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingId ? `/api/vouchers/${editingId}` : "/api/vouchers";
      const method = editingId ? "PUT" : "POST";

      const payload = {
        PaymentType: form.PaymentType,
        PartyType: form.PartyType,
        CustomerId: form.CustomerId ? Number(form.CustomerId) : undefined,
        SupplierId: form.SupplierId ? Number(form.SupplierId) : undefined,
        StaffId: form.StaffId ? Number(form.StaffId) : undefined,
        BankAccountId: form.BankAccountId ? Number(form.BankAccountId) : undefined,
        GariNo: form.GariNo,
        DriverName: form.DriverName,
        Amount: amt,
        Remarks: form.Remarks,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to save voucher record.");
      }

      setMsg(editingId ? "Voucher entry updated successfully!" : "Voucher entry saved & posted successfully!");
      resetForm();
      loadData();
      setTimeout(() => setMsg(""), 3500);
    } catch (err: any) {
      alert("Error saving voucher: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this voucher entry?")) return;
    try {
      const res = await fetch(`/api/vouchers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMsg("Voucher deleted.");
        loadData();
        setTimeout(() => setMsg(""), 3500);
      }
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  const handleShareVoucherWhatsApp = async (v: any) => {
    const partyName =
      v.Customer?.Name ||
      v.Supplier?.Name ||
      v.Staff?.Name ||
      (v.GariNo ? `Vehicle #${v.GariNo} (${v.DriverName || "Fleet"})` : "General Account");

    try {
      const blob = await createLedgerStatementImageBlob({
        title: `Voucher #${v.VoucherNumber || v.Id}`,
        subtitle: `${v.PaymentType} — ${v.PartyType}`,
        partyName: partyName,
        dateRange: v.Date || new Date().toISOString().split("T")[0],
        openingBalance: 0,
        totalIn: v.PaymentType.includes("Receipt") ? v.Amount : 0,
        totalOut: v.PaymentType.includes("Payment") ? v.Amount : 0,
        closingBalance: v.Amount,
        transactions: [
          {
            date: v.Date,
            voucher: v.VoucherNumber,
            desc: v.Remarks || `${v.PaymentType} for ${partyName}`,
            inAmount: v.PaymentType.includes("Receipt") ? v.Amount : 0,
            outAmount: v.PaymentType.includes("Payment") ? v.Amount : 0,
            balance: v.Amount,
          },
        ],
      });

      await shareOrDownloadWhatsApp({
        blob,
        filename: `Muslim-Construction-Voucher-${v.VoucherNumber || v.Id}.png`,
        shareTitle: `Voucher ${v.VoucherNumber}`,
        shareText: `*Muslim Construction — Payment Voucher*\nVoucher #: ${v.VoucherNumber}\nType: ${v.PaymentType}\nParty: ${partyName}\nAmount: Rs. ${Number(v.Amount).toLocaleString()}\nRemarks: ${v.Remarks || "None"}\n\nSoftware By Roonjha Developers : 03152914836`,
      });
    } catch (err: any) {
      alert("Error sharing: " + err.message);
    }
  };

  const filtered = vouchers.filter((v) => {
    if (typeFilter !== "all" && v.PaymentType !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchVoucher = v.VoucherNumber?.toLowerCase().includes(q);
      const matchParty =
        v.Customer?.Name?.toLowerCase().includes(q) ||
        v.Supplier?.Name?.toLowerCase().includes(q) ||
        v.Staff?.Name?.toLowerCase().includes(q) ||
        v.GariNo?.toLowerCase().includes(q) ||
        v.DriverName?.toLowerCase().includes(q);
      const matchRemarks = v.Remarks?.toLowerCase().includes(q);
      if (!matchVoucher && !matchParty && !matchRemarks) return false;
    }
    return true;
  });

  const totalReceipts = filtered
    .filter((v) => v.PaymentType === "CashReceipt" || v.PaymentType === "BankReceipt")
    .reduce((acc, curr) => acc + (curr.Amount || 0), 0);

  const totalPayments = filtered
    .filter((v) => v.PaymentType === "CashPayment" || v.PaymentType === "BankPayment")
    .reduce((acc, curr) => acc + (curr.Amount || 0), 0);

  const netCashPosition = totalReceipts - totalPayments;

  const handlePrintVouchersTable = () => {
    printTableDocument({
      title: "Cash & Bank Vouchers Ledger",
      subtitle: "Cash receipts, bank deposits, vehicle balance settlements, vendor payments, and staff advances",
      headers: ["Voucher #", "Date", "Type", "Party / Vehicle Reference", "Description", "Amount (Rs.)"],
      columnAlignments: ["left", "center", "center", "left", "left", "right"],
      rows: filtered.map((v) => {
        const partyDisplay =
          v.Customer?.Name ||
          v.Supplier?.Name ||
          v.Staff?.Name ||
          (v.GariNo ? `Vehicle #${v.GariNo} ${v.DriverName ? `(${v.DriverName})` : ""}` : "General Account");
        return [
          v.VoucherNumber,
          v.Date,
          v.PaymentType,
          `${partyDisplay} (${v.PartyType || "General"})`,
          v.Remarks || "—",
          `Rs. ${Number(v.Amount || 0).toLocaleString()}`,
        ];
      }),
      footers: [
        "",
        `TOTAL (${filtered.length} VOUCHERS)`,
        `Receipts: Rs. ${totalReceipts.toLocaleString()}`,
        `Payments: Rs. ${totalPayments.toLocaleString()}`,
        "Net Cash Position:",
        `Rs. ${netCashPosition.toLocaleString()}`,
      ],
      notes: "Software By Roonjha Developers : 03152914836 - Muslim Construction & Transport Management System",
    });
  };

  const selectedCustomer = customers.find((c) => String(c.Id) === form.CustomerId);
  const selectedSupplier = suppliers.find((s) => String(s.Id) === form.SupplierId);
  const selectedStaff = staffList.find((st) => String(st.Id) === form.StaffId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-teal-600" />
            Cash & Bank Vouchers Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cash receipts, bank deposits, vehicle balance settlements, vendor payments, and staff advances
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/cash"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            <Wallet className="w-3.5 h-3.5 text-amber-400" />
            <span>Cash Ledger</span>
          </Link>
          <Link
            href="/bank"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Bank Accounts</span>
          </Link>
          <button
            type="button"
            onClick={handlePrintVouchersTable}
            className="btn bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3 flex items-center gap-1.5 shadow-sm transition"
            title="Print vouchers table ledger"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print Ledger</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn btn-green text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> + New Voucher
          </button>
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block uppercase">Total Cash & Bank Receipts</span>
          <span className="text-2xl font-black text-emerald-600">
            Rs. {totalReceipts.toLocaleString()}
          </span>
          <p className="text-xs text-slate-400 mt-0.5">Inflow from customers & sales</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block uppercase">Total Payments Disbursed</span>
          <span className="text-2xl font-black text-rose-600">
            Rs. {totalPayments.toLocaleString()}
          </span>
          <p className="text-xs text-slate-400 mt-0.5">Disbursed to suppliers, staff & vehicles</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block uppercase">Net Cash Position</span>
          <span className={`text-2xl font-black ${totalReceipts - totalPayments >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            Rs. {(totalReceipts - totalPayments).toLocaleString()}
          </span>
          <p className="text-xs text-slate-400 mt-0.5">Current liquid net balance</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {["all", "CashPayment", "CashReceipt", "BankPayment", "BankReceipt"].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                typeFilter === type
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {type === "all" ? "All Vouchers" : type}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search party, vehicle, voucher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
          />
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading vouchers & accounts...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No voucher records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase text-[11px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Voucher #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Party / Vehicle Reference</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Receipt & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((v) => {
                  const partyDisplay =
                    v.Customer?.Name ||
                    v.Supplier?.Name ||
                    v.Staff?.Name ||
                    (v.GariNo ? `Vehicle #${v.GariNo} ${v.DriverName ? `(${v.DriverName})` : ""}` : "General Account");

                  return (
                    <tr key={v.Id} className="hover:bg-amber-50/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {v.VoucherNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{v.Date}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            v.PaymentType?.includes("Receipt")
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {v.PaymentType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div>{partyDisplay}</div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {v.PartyType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {v.Remarks || "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-black font-mono text-sm">
                        <span className={v.PaymentType?.includes("Receipt") ? "text-emerald-700" : "text-rose-700"}>
                          Rs. {Number(v.Amount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleShareVoucherWhatsApp(v)}
                            className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200"
                            title="Share Voucher on WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(v)}
                            className="p-1.5 hover:bg-slate-100 text-blue-600 rounded-lg border border-slate-200"
                            title="Edit Voucher"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(v.Id)}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg border border-slate-200"
                            title="Delete Voucher"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                <tr>
                  <td colSpan={3} className="py-3 px-4 font-black uppercase text-[11px]">
                    Grand Total ({filtered.length} Vouchers)
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <span className="text-emerald-700 font-bold">In: Rs. {totalReceipts.toLocaleString()}</span> |{" "}
                    <span className="text-rose-700 font-bold">Out: Rs. {totalPayments.toLocaleString()}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-black uppercase text-[11px]">
                    Net Position:
                  </td>
                  <td className="py-3 px-4 text-right font-black text-sm font-mono">
                    <span className={netCashPosition >= 0 ? "text-emerald-700" : "text-rose-700"}>
                      Rs. {netCashPosition.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-[10px] text-slate-500 font-semibold">
                    Settled
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create / Edit Voucher */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                {editingId ? "Edit Voucher Entry" : "Create Interconnected Financial Voucher"}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
              {/* Row 1: Payment Type & Bank Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method / Nature *</label>
                  <select
                    value={form.PaymentType}
                    onChange={(e) => setForm({ ...form, PaymentType: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white"
                  >
                    <option value="CashReceipt">Cash Receipt (Cash In)</option>
                    <option value="CashPayment">Cash Payment (Cash Out)</option>
                    <option value="BankReceipt">Bank Receipt (Deposit In)</option>
                    <option value="BankPayment">Bank Payment (Withdrawal Out)</option>
                  </select>
                </div>

                {form.PaymentType.startsWith("Bank") ? (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Bank Account *</label>
                    <select
                      required
                      value={form.BankAccountId}
                      onChange={(e) => setForm({ ...form, BankAccountId: e.target.value })}
                      className="w-full border border-amber-300 rounded-xl px-3 py-2 bg-amber-50/50"
                    >
                      <option value="">Select Bank Account...</option>
                      {bankAccounts.map((b) => (
                        <option key={b.Id} value={b.Id}>
                          {b.BankName} (Rs. {Number(b.CurrentBalance).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Account</label>
                    <div className="py-2 px-3 bg-slate-100 rounded-xl font-bold text-slate-700">
                      Physical Cash in Hand
                    </div>
                  </div>
                )}
              </div>

              {/* Row 2: Target Party Type */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Party / Target Account *</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {["Customer", "Supplier", "Staff", "Vehicle"].map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => setForm({ ...form, PartyType: pt })}
                      className={`py-2 rounded-xl font-bold border transition text-[11px] ${
                        form.PartyType === pt
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Party Selector */}
              {form.PartyType === "Customer" && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700">Select Customer *</label>
                    {selectedCustomer && (
                      <span className="text-[11px] text-amber-700 font-bold">
                        Due: Rs. {Number(selectedCustomer.BalanceDue || 0).toLocaleString()} | Adv: Rs. {Number(selectedCustomer.Advance || 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <select
                    required
                    value={form.CustomerId}
                    onChange={(e) => setForm({ ...form, CustomerId: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white"
                  >
                    <option value="">Choose registered customer...</option>
                    {customers.map((c) => (
                      <option key={c.Id} value={c.Id}>
                        {c.Name} {c.Phone ? `(${c.Phone})` : ""} - Due: Rs. {Number(c.BalanceDue || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.PartyType === "Supplier" && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700">Select Supplier / Vendor *</label>
                    {selectedSupplier && (
                      <span className="text-[11px] text-rose-700 font-bold">
                        Payable: Rs. {Number(selectedSupplier.BalanceDue || 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <select
                    required
                    value={form.SupplierId}
                    onChange={(e) => setForm({ ...form, SupplierId: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white"
                  >
                    <option value="">Choose registered supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.Id} value={s.Id}>
                        {s.Name} - Payable: Rs. {Number(s.BalanceDue || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.PartyType === "Staff" && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700">Select Staff / Labour *</label>
                    {selectedStaff && (
                      <span className="text-[11px] text-slate-600 font-bold">
                        {selectedStaff.Designation} (Salary: Rs. {Number(selectedStaff.Salary || 0).toLocaleString()})
                      </span>
                    )}
                  </div>
                  <select
                    required
                    value={form.StaffId}
                    onChange={(e) => setForm({ ...form, StaffId: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white"
                  >
                    <option value="">Choose employee...</option>
                    {staffList.map((st) => (
                      <option key={st.Id} value={st.Id}>
                        {st.Name} ({st.Designation})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.PartyType === "Vehicle" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Vehicle No *</label>
                    <select
                      required
                      value={form.GariNo}
                      onChange={(e) => {
                        const vNo = e.target.value;
                        const matched = gariyan.find((g) => g.gariNo === vNo);
                        setForm({
                          ...form,
                          GariNo: vNo,
                          DriverName: matched?.driverName || form.DriverName,
                        });
                      }}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white font-bold"
                    >
                      <option value="">Choose vehicle...</option>
                      {gariyan.map((g) => (
                        <option key={g.id} value={g.gariNo}>
                          {g.gariNo} ({g.driverName || "Fleet"})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Driver Name</label>
                    <input
                      type="text"
                      placeholder="Driver Name"
                      value={form.DriverName}
                      onChange={(e) => setForm({ ...form, DriverName: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                </div>
              )}

              {/* Amount & Remarks */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount (Rs.) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 50000"
                  value={form.Amount}
                  onChange={(e) => setForm({ ...form, Amount: e.target.value })}
                  className="w-full text-base font-black border border-amber-300 rounded-xl px-3 py-2 text-slate-900 bg-amber-50/30"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Narration / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Trip advance settlement or customer online deposit"
                  value={form.Remarks}
                  onChange={(e) => setForm({ ...form, Remarks: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow transition disabled:opacity-50"
                >
                  {submitting ? "Posting..." : editingId ? "Update Voucher" : "Post Voucher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
