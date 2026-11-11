"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Plus, Search, AlertCircle, CheckCircle, X } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    Name: "",
    Category: "Engine Oil",
    Unit: "Liters",
    SalePrice: 0,
    PurchasePrice: 0,
    StockQuantity: 0,
    LowStockAlert: 10,
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.Name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMsg("Product added to inventory successfully!");
        setShowModal(false);
        setForm({
          Name: "",
          Category: "Engine Oil",
          Unit: "Liters",
          SalePrice: 0,
          PurchasePrice: 0,
          StockQuantity: 0,
          LowStockAlert: 10,
        });
        loadProducts();
        setTimeout(() => setMsg(""), 3500);
      } else {
        alert("Failed to save product");
      }
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-green text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> + Add Product
          </button>
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

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" /> Add New Inventory Product
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Title / Grade *</label>
                <input
                  type="text"
                  required
                  value={form.Name}
                  onChange={(e) => setForm({ ...form, Name: e.target.value })}
                  placeholder="e.g. Total Rubia 20W50 4L"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={form.Category}
                    onChange={(e) => setForm({ ...form, Category: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Engine Oil">Engine Oil</option>
                    <option value="Fuel">Fuel / Diesel</option>
                    <option value="Lubricant">Gear Oil / Lubricant</option>
                    <option value="Filters">Filters</option>
                    <option value="Grease">Grease</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                  <select
                    value={form.Unit}
                    onChange={(e) => setForm({ ...form, Unit: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Liters">Liters</option>
                    <option value="Drums">Drums</option>
                    <option value="Can (4L)">Can (4L)</option>
                    <option value="Pcs">Pcs</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sale Price (Rs.)</label>
                  <input
                    type="number"
                    value={form.SalePrice}
                    onChange={(e) => setForm({ ...form, SalePrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Price (Rs.)</label>
                  <input
                    type="number"
                    value={form.PurchasePrice}
                    onChange={(e) => setForm({ ...form, PurchasePrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Opening Stock</label>
                  <input
                    type="number"
                    value={form.StockQuantity}
                    onChange={(e) => setForm({ ...form, StockQuantity: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Low Stock Warning</label>
                  <input
                    type="number"
                    value={form.LowStockAlert}
                    onChange={(e) => setForm({ ...form, LowStockAlert: parseFloat(e.target.value) || 10 })}
                    placeholder="10"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
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
                  {submitting ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
