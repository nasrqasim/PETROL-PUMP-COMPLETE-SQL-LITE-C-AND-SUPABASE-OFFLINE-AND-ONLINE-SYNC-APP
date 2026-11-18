"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building, Search, Phone, MapPin, Plus, CheckCircle, X, Trash2, Edit2, Printer, Share2, FileText } from "lucide-react";
import { printTableDocument } from "@/lib/print-table";
import {
  createLedgerStatementImageBlob,
  shareOrDownloadWhatsApp,
} from "@/lib/whatsapp-image";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    Name: "",
    Phone: "",
    Address: "",
    NTN: "",
    BalanceDue: 0,
    Advance: 0,
  });

  const loadSuppliers = () => {
    setLoading(true);
    fetch("/api/suppliers")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSuppliers(Array.isArray(data) ? data : []))
      .catch(() => setSuppliers([]))
      .finally(() => setLoading(false));
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
      const url = editingId ? `/api/suppliers/${editingId}` : "/api/suppliers";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMsg(editingId ? "Supplier updated successfully!" : "Supplier created successfully!");
        resetForm();
        loadSuppliers();
        setTimeout(() => setMsg(""), 3500);
      } else {
        alert("Failed to save supplier record.");
      }
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete supplier "${name}"?`)) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMsg(`Supplier "${name}" deleted.`);
        loadSuppliers();
        setTimeout(() => setMsg(""), 3500);
      }
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  const handleShareSupplierWhatsApp = async (s: any) => {
    try {
      const payable = Number(s.BalanceDue || 0);
      const adv = Number(s.Advance || 0);
      const netBalance = payable - adv;
      const blob = await createLedgerStatementImageBlob({
        title: "SUPPLIER PAYABLES STATEMENT",
        subtitle: "Muslim Construction & Transport Vendor Khata",
        partyName: s.Name,
        partyPhone: s.Phone || undefined,
        dateRange: `As of ${new Date().toLocaleDateString("en-GB")}`,
        openingBalance: 0,
        totalIn: payable,
        totalOut: adv,
        closingBalance: netBalance,
        transactions: [
          {
            date: new Date().toLocaleDateString("en-GB"),
            voucher: "SUPP-DUE",
            desc: "Current Outstanding Balance Payable",
            inAmount: payable,
            balance: payable,
          },
          ...(adv > 0
            ? [
                {
                  date: new Date().toLocaleDateString("en-GB"),
                  voucher: "ADV-PAID",
                  desc: "Advance Payment Disbursed",
                  outAmount: adv,
                  balance: netBalance,
                },
              ]
            : []),
        ],
      });

      const filename = `Muslim-Construction-Supplier-${s.Name.replace(/\s+/g, "_")}.png`;
      const shareTitle = `Supplier Statement: ${s.Name}`;
      const shareText = `*Muslim Construction & Transport*\n*Supplier / Vendor Statement: ${s.Name}*\nTotal Payable: *Rs. ${payable.toLocaleString()}*\nAdvance Paid: *Rs. ${adv.toLocaleString()}*\nNet Payable: *Rs. ${netBalance.toLocaleString()}*\n\nSoftware By Roonjha Developers: 03152914836`;

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

  const filtered = suppliers.filter(
    (s) =>
      s.Name?.toLowerCase().includes(search.toLowerCase()) ||
      s.Phone?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPayable = filtered.reduce((acc, s) => acc + Number(s.BalanceDue || 0), 0);
  const totalAdvance = filtered.reduce((acc, s) => acc + Number(s.Advance || 0), 0);
  const netPayable = totalPayable - totalAdvance;

  const handlePrintSuppliersLedger = () => {
    printTableDocument({
      title: "Suppliers & Material Vendors Ledger",
      subtitle: "Material suppliers, fuel vendors, payables, advances, and contact directories",
      headers: ["#", "Supplier / Vendor Name", "Contact", "Address", "Payable Due (Rs.)", "Advance Paid (Rs.)", "Net Status"],
      columnAlignments: ["center", "left", "left", "left", "right", "right", "center"],
      rows: filtered.map((s, idx) => [
        idx + 1,
        s.Name,
        s.Phone || "—",
        s.Address || "—",
        `Rs. ${Number(s.BalanceDue || 0).toLocaleString()}`,
        `Rs. ${Number(s.Advance || 0).toLocaleString()}`,
        Number(s.BalanceDue || 0) > Number(s.Advance || 0) ? "Payable" : Number(s.Advance || 0) > 0 ? "Advance" : "Settled",
      ]),
      footers: [
        "",
        `TOTAL (${filtered.length} SUPPLIERS)`,
        "",
        "",
        `Rs. ${totalPayable.toLocaleString()}`,
        `Rs. ${totalAdvance.toLocaleString()}`,
        `Net: Rs. ${netPayable.toLocaleString()}`,
      ],
      notes: "Software By Roonjha Developers : 03152914836 - Muslim Construction & Transport Management System",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm no-print">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Building className="w-6 h-6 text-indigo-600" />
            Suppliers & Material Vendors Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Material suppliers, fuel vendors, payables, advances, and contact directories
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrintSuppliersLedger}
            className="btn bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-sm transition"
            title="Print entire suppliers ledger table"
          >
            <Printer className="w-4 h-4 text-amber-400" /> Print Ledger
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setForm({ Name: "", Phone: "", Address: "", NTN: "", BalanceDue: 0, Advance: 0 });
              setShowModal(true);
            }}
            className="btn btn-green text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> + Add Supplier
          </button>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading suppliers...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No suppliers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4 text-right">Balance Due (Payable)</th>
                  <th className="py-3 px-4 text-right">Advance Paid</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.Id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800">{s.Name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {s.Phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {s.Phone}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {s.Address ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {s.Address}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-rose-600">
                      Rs. {Number(s.BalanceDue || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600">
                      Rs. {Number(s.Advance || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        <Link
                          href={`/suppliers/${s.Id}/ledger`}
                          className="flex items-center gap-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded shadow-xs transition"
                          title="View Complete Supplier Ledger"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Ledger</span>
                        </Link>
                        <button
                          onClick={() => handleShareSupplierWhatsApp(s)}
                          className="text-emerald-600 hover:text-emerald-800 p-1 rounded hover:bg-emerald-50 transition"
                          title="Share statement on WhatsApp"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(s)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition"
                          title="Edit supplier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.Id, s.Name)}
                          className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition"
                          title="Delete supplier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                <tr>
                  <td colSpan={3} className="py-3 px-4 font-black uppercase text-xs">
                    Grand Total ({filtered.length} Suppliers)
                  </td>
                  <td className="py-3 px-4 text-right font-black text-rose-700 text-sm">
                    Rs. {totalPayable.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-emerald-700 text-sm">
                    Rs. {totalAdvance.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center text-xs font-bold text-slate-700">
                    Net: Rs. {netPayable.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-400" />
                {editingId ? "Edit Supplier Details" : "Add New Supplier"}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.Name}
                  onChange={(e) => setForm({ ...form, Name: e.target.value })}
                  placeholder="e.g. Pakistan State Oil (PSO)"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={form.Phone}
                  onChange={(e) => setForm({ ...form, Phone: e.target.value })}
                  placeholder="0300-1234567"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={form.Address}
                  onChange={(e) => setForm({ ...form, Address: e.target.value })}
                  placeholder="Vendor Depot or Head Office"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Opening Balance Due
                  </label>
                  <input
                    type="number"
                    value={form.BalanceDue}
                    onChange={(e) =>
                      setForm({ ...form, BalanceDue: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Advance Paid
                  </label>
                  <input
                    type="number"
                    value={form.Advance}
                    onChange={(e) =>
                      setForm({ ...form, Advance: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-green text-xs font-bold px-5 py-2 flex items-center gap-1.5 shadow"
                >
                  {submitting ? "Saving..." : editingId ? "Update Supplier" : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
