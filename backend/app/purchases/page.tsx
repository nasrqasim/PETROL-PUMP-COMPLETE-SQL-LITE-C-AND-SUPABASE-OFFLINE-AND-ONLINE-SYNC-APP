"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building, Search, Plus, Trash2, X, CheckCircle, Percent } from "lucide-react";

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    supplierId: "",
    invoiceNumber: `PINV-${Date.now().toString().slice(-5)}`,
    date: new Date().toISOString().split("T")[0],
    subTotal: "0",
    discountAmount: "0",
    taxAmount: "0",
    paidAmount: "0",
    paymentMode: "Cash",
    remarks: "",
  });

  const loadData = () => {
    setLoading(true);
    fetch(`/api/purchases${search ? `?search=${encodeURIComponent(search)}` : ""}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPurchases(data))
      .catch(() => setPurchases([]))
      .finally(() => setLoading(false));

    fetch("/api/suppliers")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSuppliers(data))
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const grandTotal = Math.max(
    0,
    (Number(form.subTotal) || 0) - (Number(form.discountAmount) || 0) + (Number(form.taxAmount) || 0)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          subTotal: Number(form.subTotal),
          discountAmount: Number(form.discountAmount),
          taxAmount: Number(form.taxAmount),
          paidAmount: Number(form.paidAmount),
          grandTotal: grandTotal,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({
          supplierId: "",
          invoiceNumber: `PINV-${Date.now().toString().slice(-5)}`,
          date: new Date().toISOString().split("T")[0],
          subTotal: "0",
          discountAmount: "0",
          taxAmount: "0",
          paidAmount: "0",
          paymentMode: "Cash",
          remarks: "",
        });
        setMsg("Purchase invoice created successfully!");
        loadData();
        setTimeout(() => setMsg(""), 3500);
      } else {
        alert("Failed to save purchase invoice.");
      }
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this purchase invoice?")) return;
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Building className="w-6 h-6 text-blue-600" />
            Purchase Invoices & Inventory Inward
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Supplier purchase invoices, stock receipts, vendor bills, and paid amounts (Reverse order - newest top)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-blue text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> + Create Purchase Invoice
          </button>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search purchase bill..."
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
        ) : purchases.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No purchase records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4 text-right">SubTotal</th>
                  <th className="py-3 px-4 text-right">Discount</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-right">Paid Amount</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((p) => {
                  const bal = (p.GrandTotal || 0) - (p.PaidAmount || 0);
                  return (
                    <tr key={p.Id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-800">{p.InvoiceNumber}</td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {new Date(p.Date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {p.Supplier?.Name || "Direct Vendor"}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        Rs. {Number(p.SubTotal || p.GrandTotal || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-amber-600 font-semibold">
                        Rs. {Number(p.DiscountAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-800">
                        Rs. {Number(p.GrandTotal || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        Rs. {Number(p.PaidAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">
                        Rs. {Number(bal).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(p.Id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                New Purchase Invoice & Bill
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Invoice Number</label>
                  <input
                    type="text"
                    required
                    value={form.invoiceNumber}
                    onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Invoice Date</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Supplier / Vendor</label>
                <select
                  value={form.supplierId}
                  onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg"
                >
                  <option value="">Direct / Cash Purchase</option>
                  {suppliers.map((s) => (
                    <option key={s.Id} value={s.Id}>
                      {s.Name} ({s.City || "Vendor"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Bill SubTotal (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.subTotal}
                    onChange={(e) => setForm({ ...form, subTotal: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Discount (Rs.)</span>
                    <Percent className="w-3.5 h-3.5 text-amber-500" />
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.discountAmount}
                    onChange={(e) => setForm({ ...form, discountAmount: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm border border-amber-300 rounded-lg font-semibold text-amber-700 bg-amber-50/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Tax / Vat (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.taxAmount}
                    onChange={(e) => setForm({ ...form, taxAmount: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Calculated Net Total:</span>
                <span className="text-base font-black text-slate-900">
                  Rs. {grandTotal.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Paid Amount (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.paidAmount}
                    onChange={(e) => setForm({ ...form, paidAmount: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm border border-emerald-300 rounded-lg font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Payment Account / Channel</label>
                  <select
                    value={form.paymentMode}
                    onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    <option value="Cash">Cash in Hand</option>
                    <option value="Meezan Bank">Meezan Bank (Main A/C)</option>
                    <option value="Bank Al-Habib">Bank Al-Habib</option>
                    <option value="EasyPaisa">EasyPaisa Digital</option>
                    <option value="JazzCash">JazzCash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Remarks / Fuel Vehicle No</label>
                <input
                  type="text"
                  placeholder="Optional memo, bowser tank no..."
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-blue text-xs font-bold px-5 py-2"
                >
                  {submitting ? "Saving Bill..." : "Save Purchase Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
