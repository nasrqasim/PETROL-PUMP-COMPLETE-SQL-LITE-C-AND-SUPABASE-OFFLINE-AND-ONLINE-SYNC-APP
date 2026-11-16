"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building, Search, Plus, CheckCircle, X, Trash2, Edit2 } from "lucide-react";

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    supplierId: "",
    SupplierName: "",
    PaymentMode: "Credit",
    SubTotal: 0,
    DiscountAmount: 0,
    TaxAmount: 0,
    PaidAmount: 0,
    Remarks: "",
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/purchases").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/suppliers").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([purchData, suppData]) => {
        setPurchases(Array.isArray(purchData) ? purchData : []);
        setSuppliers(Array.isArray(suppData) ? suppData : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      supplierId: "",
      SupplierName: "",
      PaymentMode: "Credit",
      SubTotal: 0,
      DiscountAmount: 0,
      TaxAmount: 0,
      PaidAmount: 0,
      Remarks: "",
    });
    setShowModal(false);
  };

  const handleEdit = (p: any) => {
    setEditingId(p.Id);
    setForm({
      supplierId: p.SupplierId ? String(p.SupplierId) : "",
      SupplierName: p.Supplier?.Name || p.SupplierName || "",
      PaymentMode: p.PaymentMode || "Credit",
      SubTotal: Number(p.SubTotal || p.GrandTotal || 0),
      DiscountAmount: Number(p.DiscountAmount || p.Discount || 0),
      TaxAmount: Number(p.TaxAmount || p.Tax || 0),
      PaidAmount: Number(p.PaidAmount || 0),
      Remarks: p.Remarks || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.SubTotal || form.SubTotal <= 0) return;
    setSubmitting(true);
    const grandTotal = Math.max(0, form.SubTotal - form.DiscountAmount + form.TaxAmount);
    const selectedSupplier = suppliers.find((s) => String(s.Id) === String(form.supplierId));

    const payload = {
      ...form,
      SupplierId: form.supplierId ? parseInt(form.supplierId) : undefined,
      Supplier: selectedSupplier ? { Name: selectedSupplier.Name } : { Name: form.SupplierName || "Direct Vendor" },
      GrandTotal: grandTotal,
    };

    try {
      const url = editingId ? `/api/purchases/${editingId}` : "/api/purchases";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMsg(editingId ? "Purchase bill updated successfully!" : "Purchase invoice recorded successfully!");
        resetForm();
        loadData();
        setTimeout(() => setMsg(""), 3500);
      } else {
        alert("Failed to save purchase bill.");
      }
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this purchase bill?")) return;
    try {
      const res = await fetch(`/api/purchases/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMsg("Purchase invoice deleted.");
        loadData();
        setTimeout(() => setMsg(""), 3500);
      }
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  const filtered = purchases.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.InvoiceNumber?.toLowerCase().includes(q) ||
      p.Supplier?.Name?.toLowerCase().includes(q)
    );
  });

  const grandTotal = Math.max(0, form.SubTotal - form.DiscountAmount + form.TaxAmount);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Building className="w-6 h-6 text-blue-600" />
            Purchases & Material Stock Inward
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Supplier purchase invoices, bulk fuel intake, stone delivery bills, and vendor payables
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingId(null);
              setForm({
                supplierId: "",
                SupplierName: "",
                PaymentMode: "Credit",
                SubTotal: 0,
                DiscountAmount: 0,
                TaxAmount: 0,
                PaidAmount: 0,
                Remarks: "",
              });
              setShowModal(true);
            }}
            className="btn btn-green text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> + Record Purchase
          </button>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search invoice or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
          <div className="p-8 text-center text-slate-500">Loading purchase invoices...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No purchase invoices found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Bill #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Discount</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-right">Paid Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.Id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800">{p.InvoiceNumber}</td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {new Date(p.Date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {typeof p.Supplier === 'object' ? p.Supplier?.Name : p.Supplier || "Direct Vendor"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
                        {p.PaymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      Rs. {Number(p.SubTotal || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-semibold">
                      Rs. {Number(p.DiscountAmount || p.Discount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-rose-600">
                      Rs. {Number(p.GrandTotal || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">
                      Rs. {Number(p.PaidAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleEdit(p)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition"
                          title="Edit purchase"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.Id)}
                          className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition"
                          title="Delete purchase"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-400" />
                {editingId ? "Edit Purchase Bill" : "Record Material / Stock Purchase"}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Supplier / Vendor</label>
                <select
                  value={form.supplierId}
                  onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-semibold"
                >
                  <option value="">Select Registered Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.Id} value={s.Id}>
                      {s.Name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={form.PaymentMode}
                    onChange={(e) => setForm({ ...form, PaymentMode: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Credit">Credit / Payable (Udhar)</option>
                    <option value="Cash">Cash Payment</option>
                    <option value="Bank">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sub Total (Rs.) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.SubTotal || ""}
                    onChange={(e) =>
                      setForm({ ...form, SubTotal: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount (Rs.)</label>
                  <input
                    type="number"
                    value={form.DiscountAmount || ""}
                    onChange={(e) =>
                      setForm({ ...form, DiscountAmount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Paid Amount (Rs.)</label>
                  <input
                    type="number"
                    value={form.PaidAmount || ""}
                    onChange={(e) =>
                      setForm({ ...form, PaidAmount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-emerald-700"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center text-sm font-bold border">
                <span>Calculated Net Payable:</span>
                <span className="text-rose-700 font-black text-base">
                  Rs. {grandTotal.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Remarks</label>
                <input
                  type="text"
                  value={form.Remarks}
                  onChange={(e) => setForm({ ...form, Remarks: e.target.value })}
                  placeholder="Material specification or delivery bility #"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
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
                  {submitting ? "Saving..." : editingId ? "Update Bill" : "Save Purchase Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
