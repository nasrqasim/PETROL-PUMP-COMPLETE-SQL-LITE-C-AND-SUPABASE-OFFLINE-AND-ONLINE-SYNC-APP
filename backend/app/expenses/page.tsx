"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tag, Search, Plus, CheckCircle, X, Trash2, Calendar } from "lucide-react";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    Date: new Date().toISOString().split("T")[0],
    Category: "Shop Utilities",
    PaymentMode: "Cash",
    Amount: 0,
    Remarks: "",
  });

  const loadExpenses = () => {
    setLoading(true);
    fetch(`/api/expenses${search ? `?search=${encodeURIComponent(search)}` : ""}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setExpenses(data))
      .catch(() => setExpenses([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadExpenses();
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.Amount || form.Amount <= 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMsg("Expense recorded successfully!");
        setShowModal(false);
        setForm({
          Date: new Date().toISOString().split("T")[0],
          Category: "Shop Utilities",
          PaymentMode: "Cash",
          Amount: 0,
          Remarks: "",
        });
        loadExpenses();
        setTimeout(() => setMsg(""), 3500);
      }
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMsg("Expense deleted.");
        loadExpenses();
        setTimeout(() => setMsg(""), 3500);
      }
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  const totalExpense = expenses.reduce((sum, e) => sum + (e.Amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Tag className="w-6 h-6 text-rose-500" />
            Operating Expenses Kharcha
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Shop expenditures, bills, generator fuel, maintenance, tea, and miscellaneous
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Filtered</p>
            <p className="text-base font-black text-rose-600">Rs. {totalExpense.toLocaleString()}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-green text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> + Add Expense
          </button>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search category, remarks..."
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

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No expenses recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Expense Category</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Remarks / Details</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.Id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-600 text-xs flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(e.Date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{e.Category}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
                        {e.PaymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">{e.Remarks || "—"}</td>
                    <td className="py-3 px-4 text-right font-black text-rose-600">
                      Rs. {Number(e.Amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(e.Id)}
                        className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition"
                        title="Delete expense"
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
                <Tag className="w-4 h-4 text-rose-400" /> Record New Expense
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={form.Date}
                  onChange={(e) => setForm({ ...form, Date: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expense Category *</label>
                <select
                  value={form.Category}
                  onChange={(e) => setForm({ ...form, Category: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="Shop Rent">Shop Rent</option>
                  <option value="Electricity / Utility">Electricity / Utility</option>
                  <option value="Generator Fuel">Generator Fuel</option>
                  <option value="Staff Salaries">Staff Salaries</option>
                  <option value="Tea & Refreshment">Tea & Refreshment</option>
                  <option value="Maintenance / Repair">Maintenance / Repair</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (Rs.) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.Amount}
                    onChange={(e) => setForm({ ...form, Amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={form.PaymentMode}
                    onChange={(e) => setForm({ ...form, PaymentMode: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank Account</option>
                    <option value="EasyPaisa / JazzCash">EasyPaisa / JazzCash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={form.Remarks}
                  onChange={(e) => setForm({ ...form, Remarks: e.target.value })}
                  placeholder="Details of expense..."
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
                  {submitting ? "Saving..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
