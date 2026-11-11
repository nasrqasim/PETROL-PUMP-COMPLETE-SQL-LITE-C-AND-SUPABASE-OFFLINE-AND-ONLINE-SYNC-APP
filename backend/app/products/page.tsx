"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Plus, Search, AlertCircle } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadProducts = () => {
    setLoading(true);
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProducts(data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = products.filter(
    (p) =>
      p.Name?.toLowerCase().includes(search.toLowerCase()) ||
      p.Category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" />
            Products & Inventory Stock
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage engine oils, lubricants, diesel, filters, and current inventory stock levels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading products...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No products found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4 text-right">Sale Price</th>
                  <th className="py-3 px-4 text-right">Purchase Price</th>
                  <th className="py-3 px-4 text-center">Stock Quantity</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const isLow = p.StockQuantity <= (p.LowStockAlert || 5);
                  return (
                    <tr key={p.Id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-800">{p.Name}</td>
                      <td className="py-3 px-4 text-slate-600">{p.Category || "—"}</td>
                      <td className="py-3 px-4 text-slate-600">{p.Unit || "Litre"}</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600">
                        Rs. {Number(p.SalePrice || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-600">
                        Rs. {Number(p.PurchasePrice || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs ${
                            isLow ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {p.StockQuantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                            <AlertCircle className="w-3.5 h-3.5" /> Low Stock
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600">In Stock</span>
                        )}
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
