"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tag, Search, Plus, CheckCircle, X, Trash2, Edit2, Printer } from "lucide-react";
import { printTableDocument } from "@/lib/print-table";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    Category: "General Expense",
    PaymentMode: "Cash",
    Amount: 0,
    Remarks: "",
  });

  const loadExpenses = () => {
    setLoading(true);
    fetch("/api/expenses")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setExpenses(Array.isArray(data) ? data : []))
      .catch(() => setExpenses([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      Category: "General Expense",
      PaymentMode: "Cash",
      Amount: 0,
      Remarks: "",
    });
    setShowModal(false);
  };

  const handleEdit = (e: any) => {
    setEditingId(e.Id);
    setForm({
      Category: e.Category || "General Expense",
      PaymentMode: e.PaymentMode || "Cash",
      Amount: Number(e.Amount || 0),
      Remarks: e.Remarks || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.Amount || form.Amount <= 0) return;
    setSubmitting(true);
    try {
      const url = editingId ? `/api/expenses/${editingId}` : "/api/expenses";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMsg(editingId ? "Expense updated successfully!" : "Expense recorded successfully!");
        resetForm();
        loadExpenses();
        setTimeout(() => setMsg(""), 3500);
      } else {
        alert("Failed to save expense record.");
      }
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMsg("Expense entry deleted.");
        loadExpenses();
        setTimeout(() => setMsg(""), 3500);
      }
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  const filtered = expenses.filter(
    (e) =>
      e.Category?.toLowerCase().includes(search.toLowerCase()) ||
      e.Remarks?.toLowerCase().includes(search.toLowerCase())
  );

  const totalExpenseAmount = filtered.reduce((acc, curr) => acc + (curr.Amount || 0), 0);

  const handlePrintExpensesTable = () => {
    printTableDocument({
      title: "Daily Project & Site Expenses Ledger",
      subtitle: "Site fuel, generator costs, equipment repairs, toll fees, labour lunches, and daily maintenance",
      headers: ["Date", "Expense Category", "Payment Mode", "Description / Remarks", "Amount (Rs.)"],
      columnAlignments: ["center", "left", "center", "left", "right"],
      rows: filtered.map((e) => [
        new Date(e.Date).toLocaleDateString(),
        e.Category,
        e.PaymentMode || "Cash",
        e.Remarks || "—",
        `Rs. ${Number(e.Amount || 0).toLocaleString()}`,
      ]),
      footers: [
        "",
        `TOTAL (${filtered.length} EXPENSES)`,
        "",
        "Total Expenditures:",
        `Rs. ${totalExpenseAmount.toLocaleString()}`,
      ],
      notes: "Software By Roonjha Developers : 03152914836 - Muslim Construction & Transport Management System",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm no-print">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Tag className="w-6 h-6 text-rose-600" />
            Daily Project & Site Expenses Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Site fuel, generator costs, equipment repairs, toll fees, labour lunches, and daily maintenance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrintExpensesTable}
            className="btn bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-sm transition"
            title="Print daily expenses table ledger"
          >
            <Printer className="w-4 h-4 text-amber-400" /> Print Ledger
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setForm({
                Category: "General Expense",
                PaymentMode: "Cash",
                Amount: 0,
                Remarks: "",
              });
              setShowModal(true);
            }}
            className="btn btn-green text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> + Add Expense
          </button>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print top-cards-box">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block uppercase">Total Expenditures</span>
          <span className="text-2xl font-black text-rose-600">
            Rs. {totalExpenseAmount.toLocaleString()}
          </span>
          <p className="text-xs text-slate-400 mt-0.5">{filtered.length} entries recorded</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading daily expenses...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No expense records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Expense Category</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Description / Remarks</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((e) => (
                  <tr key={e.Id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-600 text-xs font-semibold">
                      {new Date(e.Date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{e.Category}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {e.PaymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">{e.Remarks || "—"}</td>
                    <td className="py-3 px-4 text-right font-black text-rose-600">
                      Rs. {Number(e.Amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleEdit(e)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition"
                          title="Edit expense"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(e.Id)}
                          className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition"
                          title="Delete expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                  <td colSpan={4} className="py-3 px-4">Total Expenses</td>
                  <td className="py-3 px-4 text-right text-rose-700 font-black">
                    Rs. {totalExpenseAmount.toLocaleString()}
                  </td>
                  <td></td>
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
                <Tag className="w-4 h-4 text-rose-400" />
                {editingId ? "Edit Expense Entry" : "Record New Expense"}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expense Category *</label>
                <select
                  value={form.Category}
                  onChange={(e) => setForm({ ...form, Category: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white"
                >
                  <option value="Site Machinery Maintenance">Site Machinery Maintenance</option>
                  <option value="Generator & Equipment Fuel">Generator & Equipment Fuel</option>
                  <option value="Toll Taxes & Highway Expense">Toll Taxes & Highway Expense</option>
                  <option value="Staff Mess & Daily Food">Staff Mess & Daily Food</option>
                  <option value="Utilities Bill">Utilities Bill (Electricity/Water)</option>
                  <option value="Rent Expense">Rent Expense</option>
                  <option value="General Expense">General Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={form.PaymentMode}
                  onChange={(e) => setForm({ ...form, PaymentMode: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white"
                >
                  <option value="Cash">Cash in Hand</option>
                  <option value="Bank">Bank Transfer / Online</option>
                  <option value="Cheque">Bank Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount (Rs.) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.Amount || ""}
                  onChange={(e) => setForm({ ...form, Amount: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 5000"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Remarks</label>
                <input
                  type="text"
                  value={form.Remarks}
                  onChange={(e) => setForm({ ...form, Remarks: e.target.value })}
                  placeholder="Details of expense, dumper #, or receipt #"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
                  {submitting ? "Saving..." : editingId ? "Update Expense" : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
