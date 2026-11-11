"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Search, Receipt } from "lucide-react";

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadSales = () => {
    setLoading(true);
    fetch(`/api/sales${search ? `?search=${encodeURIComponent(search)}` : ""}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSales(data))
      .catch(() => setSales([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSales();
  }, [search]);

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
        <div className="flex items-center gap-2">
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
