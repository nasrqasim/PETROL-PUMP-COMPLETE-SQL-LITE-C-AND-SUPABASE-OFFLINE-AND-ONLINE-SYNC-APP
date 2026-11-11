"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building, Search } from "lucide-react";

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadPurchases = () => {
    setLoading(true);
    fetch(`/api/purchases${search ? `?search=${encodeURIComponent(search)}` : ""}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPurchases(data))
      .catch(() => setPurchases([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPurchases();
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Building className="w-6 h-6 text-blue-600" />
            Purchase Invoices & Inventory Inward
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Supplier purchase invoices, stock receipts, vendor bills, and paid amounts
          </p>
        </div>
        <div className="flex items-center gap-2">
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
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-right">Paid Amount</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
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
                      <td className="py-3 px-4 text-right font-black text-slate-800">
                        Rs. {Number(p.GrandTotal || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        Rs. {Number(p.PaidAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">
                        Rs. {Number(bal).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
