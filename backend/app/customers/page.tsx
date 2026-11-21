"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Phone,
  MapPin,
  UserPlus,
  CheckCircle,
  X,
  Trash2,
  Edit2,
  Printer,
  Share2,
  FileText,
  Filter,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import { printTableDocument } from "@/lib/print-table";
import {
  createLedgerStatementImageBlob,
  shareOrDownloadWhatsApp,
} from "@/lib/whatsapp-image";
import { offlineDb } from "@/lib/offline-db";
import { useSyncEngine } from "@/lib/sync-engine";

export type CustomerStatusType = "All" | "Due" | "Advance" | "Settled";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatusType>("All");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const { saveOfflineFirst } = useSyncEngine();

  const [form, setForm] = useState({
    Name: "",
    Phone: "",
    Address: "",
    NTN: "",
    BalanceDue: 0,
    Advance: 0,
  });

  const loadCustomers = async () => {
    // 1. Instant local load from IndexedDB
    try {
      const local = await offlineDb.getAll("customers");
      if (local && local.length > 0) {
        setCustomers(local);
        setLoading(false);
      }
    } catch {
      // Continue to API
    }

    // 2. Network sync
    try {
      const res = await fetch("/api/customers");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.customers || [];
        setCustomers(list);
        await offlineDb.replaceAll("customers", list);
      }
    } catch (err) {
      console.warn("Offline: Serving customers from local database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({ Name: "", Phone: "", Address: "", NTN: "", BalanceDue: 0, Advance: 0 });
    setShowModal(false);
  };

  const handleEdit = (c: any) => {
    setEditingId(c.Id);
    setForm({
      Name: c.Name || "",
      Phone: c.Phone || "",
      Address: c.Address || "",
      NTN: c.NTN || "",
      BalanceDue: Number(c.BalanceDue || 0),
      Advance: Number(c.Advance || 0),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.Name.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        Id: editingId || Date.now(),
        ...form,
        UpdatedAt: new Date().toISOString(),
      };

      const url = editingId ? `/api/customers/${editingId}` : "/api/customers";
      const method = editingId ? "PUT" : "POST";

      // Offline-first save: writes to IndexedDB immediately & queues/syncs
      await saveOfflineFirst("customers", payload, url, method);

      setMsg(editingId ? "Customer updated successfully!" : "Customer created successfully!");
      resetForm();
      await loadCustomers();
      setTimeout(() => setMsg(""), 3500);
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete customer "${name}"?`)) return;
    try {
      await offlineDb.delete("customers", id);
      fetch(`/api/customers/${id}`, { method: "DELETE" }).catch(() => {});
      setMsg(`Customer "${name}" deleted.`);
      await loadCustomers();
      setTimeout(() => setMsg(""), 3500);
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  const handleShareCustomerWhatsApp = async (c: any) => {
    try {
      const due = Number(c.BalanceDue || 0);
      const adv = Number(c.Advance || 0);
      const netBalance = due - adv;
      const blob = await createLedgerStatementImageBlob({
        title: "CUSTOMER RECEIVABLES STATEMENT",
        subtitle: "Muslim Construction & Transport Client Khata",
        partyName: c.Name,
        partyPhone: c.Phone || undefined,
        dateRange: `As of ${new Date().toLocaleDateString("en-GB")}`,
        openingBalance: 0,
        totalIn: due,
        totalOut: adv,
        closingBalance: netBalance,
        transactions: [
          {
            date: new Date().toLocaleDateString("en-GB"),
            voucher: "CUST-DUE",
            desc: "Current Outstanding Balance Due",
            inAmount: due,
            balance: due,
          },
          ...(adv > 0
            ? [
                {
                  date: new Date().toLocaleDateString("en-GB"),
                  voucher: "ADV-REC",
                  desc: "Advance Deposit Received",
                  outAmount: adv,
                  balance: netBalance,
                },
              ]
            : []),
        ],
      });

      const filename = `Muslim-Construction-Customer-${c.Name.replace(/\s+/g, "_")}.png`;
      const shareTitle = `Customer Ledger: ${c.Name}`;
      const shareText = `*Muslim Construction & Transport*\n*Customer Ledger Statement: ${c.Name}*\nTotal Due: *Rs. ${due.toLocaleString()}*\nAdvance: *Rs. ${adv.toLocaleString()}*\nNet Balance: *Rs. ${netBalance.toLocaleString()}*\n\nSoftware By Roonjha Developers: 03152914836`;

      await shareOrDownloadWhatsApp({
        blob,
        filename,
        shareTitle,
        shareText,
      });
    } catch (err: any) {
      alert("Failed to share on WhatsApp: " + err.message);
    }
  };

  // Determine Customer Status automatically
  const getCustomerStatus = (c: any): "Due" | "Advance" | "Settled" => {
    const due = Number(c.BalanceDue || 0);
    const adv = Number(c.Advance || 0);
    if (adv > due && adv > 0) return "Advance";
    if (due > 0) return "Due";
    return "Settled";
  };

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        c.Name?.toLowerCase().includes(q) ||
        c.Phone?.toLowerCase().includes(q) ||
        c.Address?.toLowerCase().includes(q) ||
        String(c.Id).includes(q);

      if (!matchesSearch) return false;

      const st = getCustomerStatus(c);
      if (statusFilter === "Due") return st === "Due";
      if (statusFilter === "Advance") return st === "Advance";
      if (statusFilter === "Settled") return st === "Settled";
      return true;
    });
  }, [customers, search, statusFilter]);

  const totalBalanceDue = useMemo(
    () => filtered.reduce((acc, c) => acc + Number(c.BalanceDue || 0), 0),
    [filtered]
  );
  const totalAdvanceReceived = useMemo(
    () => filtered.reduce((acc, c) => acc + Number(c.Advance || 0), 0),
    [filtered]
  );
  const netReceivable = totalBalanceDue - totalAdvanceReceived;

  const countDue = useMemo(
    () => customers.filter((c) => getCustomerStatus(c) === "Due").length,
    [customers]
  );
  const countAdvance = useMemo(
    () => customers.filter((c) => getCustomerStatus(c) === "Advance").length,
    [customers]
  );
  const countSettled = useMemo(
    () => customers.filter((c) => getCustomerStatus(c) === "Settled").length,
    [customers]
  );

  const handlePrintLedger = () => {
    printTableDocument({
      title: "Customers & Receivables Ledger",
      subtitle: "Customer directories, outstanding balances, advances, and contact records",
      headers: ["#", "Customer Name", "Contact", "Address", "Balance Due", "Advance Received", "Account Status"],
      columnAlignments: ["center", "left", "left", "left", "right", "right", "center"],
      rows: filtered.map((c, idx) => [
        idx + 1,
        c.Name,
        c.Phone || "—",
        c.Address || "—",
        `Rs. ${Number(c.BalanceDue || 0).toLocaleString()}`,
        `Rs. ${Number(c.Advance || 0).toLocaleString()}`,
        getCustomerStatus(c) === "Due"
          ? "Due (Udhaar)"
          : getCustomerStatus(c) === "Advance"
          ? "Advance Available"
          : "Settled (Neutral)",
      ]),
      footers: [
        "",
        `Grand Total (${filtered.length} Customers)`,
        "",
        "",
        `Rs. ${totalBalanceDue.toLocaleString()}`,
        `Rs. ${totalAdvanceReceived.toLocaleString()}`,
        `Net Due: Rs. ${netReceivable.toLocaleString()}`,
      ],
      notes: "Software By Roonjha Developers : 03152914836 - Muslim Construction & Transport Management System",
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs no-print">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-600" />
              Customers & Receivables Directory
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Offline-First Persistent
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time client ledger, automatic financial status tracking, advance credit & due balances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrintLedger}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition shadow-xs"
            title="Print entire customers ledger table"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Ledger</span>
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setForm({ Name: "", Phone: "", Address: "", NTN: "", BalanceDue: 0, Advance: 0 });
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 no-print">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Customers
          </span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            {customers.length}
          </span>
          <span className="text-[10px] text-slate-500">Registered client accounts</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">
            Total Receivables Due
          </span>
          <span className="text-xl font-black text-rose-600 mt-1 block">
            Rs. {totalBalanceDue.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500">{countDue} customers with pending balance</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
            Total Advance Available
          </span>
          <span className="text-xl font-black text-emerald-700 mt-1 block">
            Rs. {totalAdvanceReceived.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500">{countAdvance} customers with credit</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
            Net Due Position
          </span>
          <span className="text-xl font-black text-blue-800 mt-1 block">
            Rs. {netReceivable.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500">Gross Due less Advance credit</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 no-print">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter("All")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === "All"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("Due")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === "Due"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            Due / Udhaar ({countDue})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("Advance")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === "Advance"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            Advance Available ({countAdvance})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("Settled")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === "Settled"
                ? "bg-slate-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Settled ({countSettled})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone, address, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading customer directories...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No customers found matching filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-3 text-center">#</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-3">Contact & Location</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-right">Advance Received</th>
                  <th className="py-3 px-3 text-center">Account Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((c, idx) => {
                  const status = getCustomerStatus(c);
                  return (
                    <tr key={c.Id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{c.Name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: #{c.Id}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {c.Phone && (
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{c.Phone}</span>
                          </div>
                        )}
                        {c.Address && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{c.Address}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-rose-600 text-sm font-mono">
                        Rs. {Number(c.BalanceDue || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600 text-sm font-mono">
                        Rs. {Number(c.Advance || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {status === "Due" ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                            Due: Rs. {Number(c.BalanceDue).toLocaleString()}
                          </span>
                        ) : status === "Advance" ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Advance: Rs. {Number(c.Advance).toLocaleString()}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                            Settled
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex justify-center items-center gap-1.5">
                          <Link
                            href={`/customers/${c.Id}/ledger`}
                            className="flex items-center gap-1 text-[11px] font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 px-2.5 py-1 rounded-lg shadow-xs transition"
                            title="View Complete Customer Ledger"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Ledger</span>
                          </Link>
                          <button
                            onClick={() => handleShareCustomerWhatsApp(c)}
                            className="text-emerald-700 hover:text-emerald-900 p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
                            title="Share statement on WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEdit(c)}
                            className="text-blue-700 hover:text-blue-900 p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
                            title="Edit customer details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.Id, c.Name)}
                            className="text-rose-700 hover:text-rose-900 p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
                            title="Delete customer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-bold text-xs">
                <tr>
                  <td colSpan={3} className="py-3.5 px-4 font-black uppercase text-[11px] text-amber-400">
                    Grand Total ({filtered.length} Customers)
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-rose-300 text-sm font-mono">
                    Rs. {totalBalanceDue.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-300 text-sm font-mono">
                    Rs. {totalAdvanceReceived.toLocaleString()}
                  </td>
                  <td colSpan={2} className="py-3.5 px-4 text-center text-xs font-bold text-slate-300 font-mono">
                    Net Outstanding: Rs. {netReceivable.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Developer Attribution Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500 font-bold">
          Software By Roonjha Developers : 03152914836
        </div>
      </div>

      {/* Modal: Add / Edit Customer */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 border border-slate-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">
                  {editingId ? "Edit Customer Details" : "Register New Customer"}
                </h3>
                <p className="text-xs text-slate-400">
                  Customer records are saved offline-first and synchronized automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer / Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al-Madina Builders"
                  value={form.Name}
                  onChange={(e) => setForm({ ...form, Name: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="03001234567"
                    value={form.Phone}
                    onChange={(e) => setForm({ ...form, Phone: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NTN / Tax Number
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={form.NTN}
                    onChange={(e) => setForm({ ...form, NTN: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Site / Delivery Address
                </label>
                <input
                  type="text"
                  placeholder="Site Area Hub / Karachi"
                  value={form.Address}
                  onChange={(e) => setForm({ ...form, Address: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-rose-700 mb-1">
                    Starting Balance Due (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.BalanceDue || ""}
                    onChange={(e) => setForm({ ...form, BalanceDue: Number(e.target.value) || 0 })}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-rose-600 focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-emerald-700 mb-1">
                    Starting Advance (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.Advance || ""}
                    onChange={(e) => setForm({ ...form, Advance: Number(e.target.value) || 0 })}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-emerald-600 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 text-xs font-black text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingId ? "Save Changes" : "Create Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
