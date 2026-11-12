"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Search, Receipt, Plus, CheckCircle, X, Trash2 } from "lucide-react";

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    CustomerName: "Walk-in Customer",
    PaymentMode: "Cash",
    SubTotal: 0,
    Discount: 0,
    Tax: 0,
    PaidAmount: 0,
    Remarks: "",
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/sales${search ? `?search=${encodeURIComponent(search)}` : ""}`).then((r) => (r.ok ? r.json() : [])),
      fetch("/api/customers").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([salesData, custData]) => {
        setSales(salesData);
        setCustomers(custData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.SubTotal || form.SubTotal <= 0) return;
    setSubmitting(true);
    const grandTotal = Math.max(0, form.SubTotal - form.Discount + form.Tax);
    const payload = {
      ...form,
      GrandTotal: grandTotal,
      PaidAmount: form.PaymentMode === "Credit" ? 0 : grandTotal,
    };

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMsg("Sales invoice created successfully!");
        setShowModal(false);
        setForm({
          CustomerName: "Walk-in Customer",
          PaymentMode: "Cash",
          SubTotal: 0,
          Discount: 0,
          Tax: 0,
          PaidAmount: 0,
          Remarks: "",
        });
        loadData();
        setTimeout(() => setMsg(""), 3500);
      }
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMsg("Sales invoice deleted.");
        loadData();
        setTimeout(() => setMsg(""), 3500);
      }
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-emerald-600" />
            Sales Invoices & Billing
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete billing records, customer invoices, payment modes, and invoice totals
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-green text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> + Create Invoice
          </button>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search invoice or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
          <div className="p-8 text-center text-slate-500">Loading sales invoices...</div>
        ) : sales.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No sales invoices found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Discount</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-right">Paid Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((s) => (
                  <tr key={s.Id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800">{s.InvoiceNumber}</td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {new Date(s.Date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {s.Customer?.Name || "Walk-in Customer"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
                        {s.PaymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      Rs. {Number(s.SubTotal || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-600 font-semibold">
                      Rs. {Number(s.Discount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600">
                      Rs. {Number(s.GrandTotal || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">
                      Rs. {Number(s.PaidAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(s.Id)}
                        className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition"
                        title="Delete invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" /> Create Fast Sales Invoice
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer</label>
                <input
                  type="text"
                  required
                  value={form.CustomerName}
                  onChange={(e) => setForm({ ...form, CustomerName: e.target.value })}
                  placeholder="e.g. Ahmed Khan or Walk-in"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Medium</label>
                  <select
                    value={form.PaymentMode}
                    onChange={(e) => setForm({ ...form, PaymentMode: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Cash">Cash (کیش ان ہینڈ)</option>
                    <option value="Meezan Bank">Meezan Bank</option>
                    <option value="Bank Al-Habib">Bank Al-Habib</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Credit">Credit / Khata (ادھار)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sub Total (Rs.) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.SubTotal}
                    onChange={(e) => setForm({ ...form, SubTotal: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount (Rs.)</label>
                  <input
                    type="number"
                    value={form.Discount}
                    onChange={(e) => setForm({ ...form, Discount: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tax / GST (Rs.)</label>
                  <input
                    type="number"
                    value={form.Tax}
                    onChange={(e) => setForm({ ...form, Tax: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">Calculated Grand Total:</span>
                <span className="font-black text-emerald-600 text-base">
                  Rs. {Math.max(0, form.SubTotal - form.Discount + form.Tax).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-green text-xs font-bold px-5 py-2 flex items-center gap-1.5 shadow"
                >
                  {submitting ? "Saving..." : "Save Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
