"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Receipt, Search, ArrowUpRight, ArrowDownLeft, Truck, User, Plus, CheckCircle, X, Trash2 } from "lucide-react";

export default function CashBankPage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    VoucherType: "CashPayment",
    PartyType: "Vehicle",
    GariNo: "",
    DriverName: "",
    PartyName: "",
    Amount: 0,
    Remarks: "",
  });

  const loadVouchers = () => {
    setLoading(true);
    fetch("/api/vouchers")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setVouchers(data))
      .catch(() => setVouchers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.Amount || form.Amount <= 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMsg("Voucher / Payment settlement saved successfully!");
        setShowModal(false);
        setForm({
          VoucherType: "CashPayment",
          PartyType: "Vehicle",
          GariNo: "",
          DriverName: "",
          PartyName: "",
          Amount: 0,
          Remarks: "",
        });
        loadVouchers();
        setTimeout(() => setMsg(""), 3500);
      }
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this voucher?")) return;
    try {
      const res = await fetch(`/api/vouchers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMsg("Voucher deleted.");
        loadVouchers();
        setTimeout(() => setMsg(""), 3500);
      }
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  const filtered = vouchers.filter((v) => {
    const matchesSearch =
      v.VoucherNumber?.toLowerCase().includes(search.toLowerCase()) ||
      v.Remarks?.toLowerCase().includes(search.toLowerCase()) ||
      v.GariNo?.toLowerCase().includes(search.toLowerCase()) ||
      v.DriverName?.toLowerCase().includes(search.toLowerCase()) ||
      v.Customer?.Name?.toLowerCase().includes(search.toLowerCase()) ||
      v.Supplier?.Name?.toLowerCase().includes(search.toLowerCase());

    if (typeFilter === "all") return matchesSearch;
    return matchesSearch && v.PaymentType?.toString() === typeFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-teal-600" />
            Cash & Bank Vouchers / Vehicle Settlement
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cash / Bank payments & receipts, customer collections, vendor payments, and vehicle Baqaya zeroing settlements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-green text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> + New Voucher / Settle
          </button>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            <option value="all">All Vouchers</option>
            <option value="CashPayment">Cash Payment</option>
            <option value="CashReceipt">Cash Receipt</option>
            <option value="BankPayment">Bank Payment</option>
            <option value="BankReceipt">Bank Receipt</option>
          </select>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search voucher, gari, party..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
          <div className="p-8 text-center text-slate-500">Loading vouchers...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No vouchers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Voucher #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Party / Vehicle / Driver</th>
                  <th className="py-3 px-4">Description / Remarks</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((v) => {
                  const isPayment = v.PaymentType?.toString().includes("Payment");
                  const partyDisplay =
                    v.GariNo ? (
                      <span className="flex items-center gap-1 font-bold text-blue-700">
                        <Truck className="w-3.5 h-3.5" /> {v.GariNo} {v.DriverName ? `(${v.DriverName})` : ""}
                      </span>
                    ) : v.Customer ? (
                      <span className="font-semibold text-slate-800">Customer: {typeof v.Customer === 'object' ? v.Customer?.Name : v.Customer || "—"}</span>
                    ) : v.Supplier ? (
                      <span className="font-semibold text-slate-800">Supplier: {typeof v.Supplier === 'object' ? v.Supplier?.Name : v.Supplier || "—"}</span>
                    ) : v.Staff ? (
                      <span className="font-semibold text-purple-700 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> Staff: {typeof v.Staff === 'object' ? v.Staff?.Name : v.Staff || "—"}
                      </span>
                    ) : (
                      <span className="text-slate-500">General</span>
                    );

                  return (
                    <tr key={v.Id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-800">{v.VoucherNumber}</td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {new Date(v.Date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isPayment ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {isPayment ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                          {v.PaymentType}
                        </span>
                      </td>
                      <td className="py-3 px-4">{partyDisplay}</td>
                      <td className="py-3 px-4 text-slate-600 text-xs max-w-xs truncate">{v.Remarks || "—"}</td>
                      <td
                        className={`py-3 px-4 text-right font-black ${
                          isPayment ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        Rs. {Number(v.Amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(v.Id)}
                          className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition"
                          title="Delete voucher"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Receipt className="w-4 h-4 text-teal-400" /> Create Voucher / Vehicle Settlement
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Voucher Type *</label>
                  <select
                    value={form.VoucherType}
                    onChange={(e) => setForm({ ...form, VoucherType: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="CashPayment">Cash Payment</option>
                    <option value="CashReceipt">Cash Receipt</option>
                    <option value="BankPayment">Bank Payment</option>
                    <option value="BankReceipt">Bank Receipt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Party Classification *</label>
                  <select
                    value={form.PartyType}
                    onChange={(e) => setForm({ ...form, PartyType: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Vehicle">Vehicle (گاڑی حساب کتاب)</option>
                    <option value="Customer">Customer (گاہک)</option>
                    <option value="Supplier">Supplier / Vendor</option>
                    <option value="Staff">Staff / Driver</option>
                  </select>
                </div>
              </div>

              {form.PartyType === "Vehicle" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle / Gari No *</label>
                    <input
                      type="text"
                      required
                      value={form.GariNo}
                      onChange={(e) => setForm({ ...form, GariNo: e.target.value })}
                      placeholder="e.g. 786"
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Driver Name</label>
                    <input
                      type="text"
                      value={form.DriverName}
                      onChange={(e) => setForm({ ...form, DriverName: e.target.value })}
                      placeholder="e.g. Rashid"
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Party / Person Title</label>
                  <input
                    type="text"
                    value={form.PartyName}
                    onChange={(e) => setForm({ ...form, PartyName: e.target.value })}
                    placeholder="Enter name..."
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Amount (Rs.) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.Amount}
                  onChange={(e) => setForm({ ...form, Amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none font-black text-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Settlement Description</label>
                <input
                  type="text"
                  value={form.Remarks}
                  onChange={(e) => setForm({ ...form, Remarks: e.target.value })}
                  placeholder="e.g. Cleared vehicle Baqaya to 0"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
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
                  {submitting ? "Saving..." : "Save Voucher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
