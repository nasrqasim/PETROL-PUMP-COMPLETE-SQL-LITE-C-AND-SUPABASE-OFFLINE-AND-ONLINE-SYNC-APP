"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Receipt, Search, Tag, Calendar } from "lucide-react";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
            Shop operational expenditures, bills, electricity, generator fuel, maintenance, tea, and miscellaneous
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Filtered</p>
            <p className="text-base font-black text-rose-600">Rs. {totalExpense.toLocaleString()}</p>
          </div>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
