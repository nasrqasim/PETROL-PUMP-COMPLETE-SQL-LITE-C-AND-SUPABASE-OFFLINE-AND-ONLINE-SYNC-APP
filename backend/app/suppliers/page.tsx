"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Building,
  Search,
  Phone,
  MapPin,
  Plus,
  CheckCircle,
  X,
  Trash2,
  Edit2,
  Printer,
  Share2,
  FileText,
  Filter,
  DollarSign,
} from "lucide-react";
import { printTableDocument } from "@/lib/print-table";
import {
  createLedgerStatementImageBlob,
  shareOrDownloadWhatsApp,
} from "@/lib/whatsapp-image";
import { offlineDb } from "@/lib/offline-db";
import { useSyncEngine } from "@/lib/sync-engine";

export type SupplierStatusType = "All" | "Due" | "Advance" | "Settled";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SupplierStatusType>("All");
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

  const loadSuppliers = async () => {
    // 1. Instant local load from IndexedDB
    try {
      const local = await offlineDb.getAll("suppliers");
      if (local && local.length > 0) {
        setSuppliers(local);
        setLoading(false);
      }
    } catch {
      // Continue to API
    }

    // 2. Network sync
    try {
      const res = await fetch("/api/suppliers");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.suppliers || [];
        setSuppliers(list);
        await offlineDb.bulkPut("suppliers", list);
      }
    } catch (err) {
      console.warn("Offline: Serving suppliers from local database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({ Name: "", Phone: "", Address: "", NTN: "", BalanceDue: 0, Advance: 0 });
    setShowModal(false);
  };

  const handleEdit = (s: any) => {
    setEditingId(s.Id);
    setForm({
      Name: s.Name || "",
      Phone: s.Phone || "",
      Address: s.Address || "",
      NTN: s.NTN || "",
      BalanceDue: Number(s.BalanceDue || 0),
      Advance: Number(s.Advance || 0),
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

      const url = editingId ? `/api/suppliers/${editingId}` : "/api/suppliers";
      const method = editingId ? "PUT" : "POST";

      // Offline-first save: writes to IndexedDB immediately & queues/syncs
      await saveOfflineFirst("suppliers", payload, url, method);

      setMsg(editingId ? "Supplier updated successfully!" : "Supplier registered successfully!");
      resetForm();
      await loadSuppliers();
      setTimeout(() => setMsg(""), 3500);
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete supplier "${name}"?`)) return;
    try {
      await offlineDb.delete("suppliers", id);
      fetch(`/api/suppliers/${id}`, { method: "DELETE" }).catch(() => {});
      setMsg(`Supplier "${name}" deleted.`);
      await loadSuppliers();
      setTimeout(() => setMsg(""), 3500);
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  const handleShareSupplierWhatsApp = async (s: any) => {
    try {
      const due = Number(s.BalanceDue || 0);
      const adv = Number(s.Advance || 0);
      const netPayable = due - adv;
      const blob = await createLedgerStatementImageBlob({
        title: "SUPPLIER PAYABLES STATEMENT",
        subtitle: "Muslim Construction & Transport Vendor Khata",
        partyName: s.Name,
        partyPhone: s.Phone || undefined,
        dateRange: `As of ${new Date().toLocaleDateString("en-GB")}`,
        openingBalance: 0,
        totalIn: due,
        totalOut: adv,
        closingBalance: netPayable,
        transactions: [
          {
            date: new Date().toLocaleDateString("en-GB"),
            voucher: "SUPP-BILL",
            desc: "Outstanding Bill Payable",
            inAmount: due,
            balance: due,
          },
          ...(adv > 0
            ? [
                {
                  date: new Date().toLocaleDateString("en-GB"),
                  voucher: "SUPP-ADV",
                  desc: "Advance Payment Disbursed",
                  outAmount: adv,
                  balance: netPayable,
                },
              ]
            : []),
        ],
      });

      const filename = `Muslim-Construction-Supplier-${s.Name.replace(/\s+/g, "_")}.png`;
      const shareTitle = `Supplier Statement: ${s.Name}`;
      const shareText = `*Muslim Construction & Transport*\n*Supplier Ledger Statement: ${s.Name}*\nTotal Payable: *Rs. ${due.toLocaleString()}*\nAdvance Disbursed: *Rs. ${adv.toLocaleString()}*\nNet Payable: *Rs. ${netPayable.toLocaleString()}*\n\nSoftware By Roonjha Developers: 03152914836`;

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

  const getSupplierStatus = (s: any): "Due" | "Advance" | "Settled" => {
    const due = Number(s.BalanceDue || 0);
    const adv = Number(s.Advance || 0);
    if (adv > due && adv > 0) return "Advance";
    if (due > 0) return "Due";
    return "Settled";
  };

  const filtered = useMemo(() => {
    return suppliers.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        s.Name?.toLowerCase().includes(q) ||
        s.Phone?.toLowerCase().includes(q) ||
        s.Address?.toLowerCase().includes(q) ||
        String(s.Id).includes(q);

      if (!matchesSearch) return false;

      const st = getSupplierStatus(s);
      if (statusFilter === "Due") return st === "Due";
      if (statusFilter === "Advance") return st === "Advance";
      if (statusFilter === "Settled") return st === "Settled";
      return true;
    });
  }, [suppliers, search, statusFilter]);

  const totalBalanceDue = useMemo(
    () => filtered.reduce((acc, s) => acc + Number(s.BalanceDue || 0), 0),
    [filtered]
  );
  const totalAdvancePaid = useMemo(
    () => filtered.reduce((acc, s) => acc + Number(s.Advance || 0), 0),
    [filtered]
  );
  const netPayable = totalBalanceDue - totalAdvancePaid;

  const countDue = useMemo(
    () => suppliers.filter((s) => getSupplierStatus(s) === "Due").length,
    [suppliers]
  );
  const countAdvance = useMemo(
    () => suppliers.filter((s) => getSupplierStatus(s) === "Advance").length,
    [suppliers]
  );
  const countSettled = useMemo(
    () => suppliers.filter((s) => getSupplierStatus(s) === "Settled").length,
    [suppliers]
  );

  const handlePrintLedger = () => {
    printTableDocument({
      title: "Suppliers & Payables Ledger",
      subtitle: "Vendor directories, material suppliers, depot balances, and advance settlements",
      headers: ["#", "Supplier Name", "Contact", "Address", "Payable Due", "Advance Disbursed", "Account Status"],
      columnAlignments: ["center", "left", "left", "left", "right", "right", "center"],
      rows: filtered.map((s, idx) => [
        idx + 1,
        s.Name,
        s.Phone || "—",
        s.Address || "—",
        `Rs. ${Number(s.BalanceDue || 0).toLocaleString()}`,
        `Rs. ${Number(s.Advance || 0).toLocaleString()}`,
        getSupplierStatus(s) === "Due"
          ? "Due (Payable)"
          : getSupplierStatus(s) === "Advance"
          ? "Advance Disbursed"
          : "Settled (Neutral)",
      ]),
      footers: [
        "",
        `Grand Total (${filtered.length} Suppliers)`,
        "",
        "",
        `Rs. ${totalBalanceDue.toLocaleString()}`,
        `Rs. ${totalAdvancePaid.toLocaleString()}`,
        `Net Payable: Rs. ${netPayable.toLocaleString()}`,
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
              <Building className="w-6 h-6 text-indigo-600" />
              Suppliers & Vendors Directory
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Offline-First Persistent
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Fuel depots (PSO, Attock), spare part shops, tyre vendors, and quarry supplier ledgers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrintLedger}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition shadow-xs"
            title="Print entire suppliers ledger table"
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
            <Plus className="w-4 h-4" />
            <span>+ Add Supplier</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 no-print">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Suppliers
          </span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            {suppliers.length}
          </span>
          <span className="text-[10px] text-slate-500">Registered vendor accounts</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">
            Total Payables Due
          </span>
          <span className="text-xl font-black text-rose-600 mt-1 block">
            Rs. {totalBalanceDue.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500">{countDue} suppliers to disburse</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
            Total Advance Disbursed
          </span>
          <span className="text-xl font-black text-emerald-700 mt-1 block">
            Rs. {totalAdvancePaid.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500">{countAdvance} vendors with advance balance</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
            Net Payable Position
          </span>
          <span className="text-xl font-black text-blue-800 mt-1 block">
            Rs. {netPayable.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500">Gross Payable less Advance balance</span>
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
            All ({suppliers.length})
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
            Due / Payable ({countDue})
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
            Advance Paid ({countAdvance})
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
            placeholder="Search by vendor, phone, address, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
          <div className="p-12 text-center text-xs text-slate-400">Loading supplier directories...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No suppliers found matching filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-3 text-center">#</th>
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-3">Contact & Location</th>
                  <th className="py-3 px-4 text-right">Payable Due</th>
                  <th className="py-3 px-4 text-right">Advance Disbursed</th>
                  <th className="py-3 px-3 text-center">Account Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((s, idx) => {
                  const status = getSupplierStatus(s);
                  return (
                    <tr key={s.Id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{s.Name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: #{s.Id}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {s.Phone && (
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{s.Phone}</span>
                          </div>
                        )}
                        {s.Address && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{s.Address}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-rose-600 text-sm font-mono">
                        Rs. {Number(s.BalanceDue || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600 text-sm font-mono">
                        Rs. {Number(s.Advance || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {status === "Due" ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                            Payable: Rs. {Number(s.BalanceDue).toLocaleString()}
                          </span>
                        ) : status === "Advance" ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Advance: Rs. {Number(s.Advance).toLocaleString()}
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
                            href={`/suppliers/${s.Id}/ledger`}
                            className="flex items-center gap-1 text-[11px] font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 px-2.5 py-1 rounded-lg shadow-xs transition"
                            title="View Complete Supplier Ledger"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Ledger</span>
                          </Link>
                          <button
                            onClick={() => handleShareSupplierWhatsApp(s)}
                            className="text-emerald-700 hover:text-emerald-900 p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
                            title="Share statement on WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEdit(s)}
                            className="text-blue-700 hover:text-blue-900 p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
                            title="Edit supplier details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.Id, s.Name)}
                            className="text-rose-700 hover:text-rose-900 p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
                            title="Delete supplier"
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
                    Grand Total ({filtered.length} Suppliers)
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-rose-300 text-sm font-mono">
                    Rs. {totalBalanceDue.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-300 text-sm font-mono">
                    Rs. {totalAdvancePaid.toLocaleString()}
                  </td>
                  <td colSpan={2} className="py-3.5 px-4 text-center text-xs font-bold text-slate-300 font-mono">
                    Net Payable: Rs. {netPayable.toLocaleString()}
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

      {/* Modal: Add / Edit Supplier */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 border border-slate-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">
                  {editingId ? "Edit Supplier Details" : "Register New Supplier / Vendor"}
                </h3>
                <p className="text-xs text-slate-400">
                  Supplier records are saved offline-first and synchronized automatically.
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
                  Supplier / Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pakistan State Oil (PSO)"
                  value={form.Name}
                  onChange={(e) => setForm({ ...form, Name: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone / Contact
                  </label>
                  <input
                    type="text"
                    placeholder="03001234567"
                    value={form.Phone}
                    onChange={(e) => setForm({ ...form, Phone: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Office / Depot Address
                </label>
                <input
                  type="text"
                  placeholder="Main Hub Depot / Lasbela"
                  value={form.Address}
                  onChange={(e) => setForm({ ...form, Address: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-rose-700 mb-1">
                    Starting Payable Due (Rs.)
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
                    Starting Advance Disbursed (Rs.)
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
                  {submitting ? "Saving..." : editingId ? "Save Changes" : "Create Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
