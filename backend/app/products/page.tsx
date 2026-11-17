"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Search, AlertTriangle, Plus, CheckCircle, X, Trash2, Edit2, Printer } from "lucide-react";
import { printTableDocument } from "@/lib/print-table";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    Name: "",
    Category: "Fuel",
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
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      Name: "",
      Category: "Fuel",
      Unit: "Liters",
      SalePrice: 0,
      PurchasePrice: 0,
      StockQuantity: 0,
      LowStockAlert: 10,
    });
    setShowModal(false);
  };

  const handleEdit = (p: any) => {
    setEditingId(p.Id);
    setForm({
      Name: p.Name || "",
      Category: p.Category || "Fuel",
      Unit: p.Unit || "Liters",
      SalePrice: Number(p.SalePrice || 0),
      PurchasePrice: Number(p.PurchasePrice || 0),
      StockQuantity: Number(p.StockQuantity || 0),
      LowStockAlert: Number(p.LowStockAlert || 10),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.Name.trim()) return;
    setSubmitting(true);
    try {
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMsg(editingId ? "Product updated successfully!" : "Product added successfully!");
        resetForm();
        loadProducts();
        setTimeout(() => setMsg(""), 3500);
      } else {
        alert("Failed to save product record.");
      }
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete product "${name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMsg(`Product "${name}" deleted.`);
        loadProducts();
        setTimeout(() => setMsg(""), 3500);
      }
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.Name?.toLowerCase().includes(search.toLowerCase()) ||
      p.Category?.toLowerCase().includes(search.toLowerCase())
  );

  const totalStockQuantity = filtered.reduce((acc, p) => acc + Number(p.StockQuantity || 0), 0);
  const totalInventoryValue = filtered.reduce((acc, p) => acc + (Number(p.StockQuantity || 0) * Number(p.PurchasePrice || 0)), 0);

  const handlePrintProductsTable = () => {
    printTableDocument({
      title: "Material & Products Inventory Master",
      subtitle: "Fuel stocks, crush stone, lubricants, sale prices, cost prices, and stock indicators",
      headers: ["Item Name", "Category", "Unit", "Sale Price (Rs.)", "Cost Price (Rs.)", "Stock Quantity", "Stock Status"],
      columnAlignments: ["left", "left", "center", "right", "right", "right", "center"],
      rows: filtered.map((p) => [
        p.Name,
        p.Category || "General",
        p.Unit || "Liters",
        `Rs. ${Number(p.SalePrice || 0).toLocaleString()}`,
        `Rs. ${Number(p.PurchasePrice || 0).toLocaleString()}`,
        Number(p.StockQuantity || 0).toLocaleString(),
        p.StockQuantity <= p.LowStockAlert ? "LOW STOCK" : "Adequate",
      ]),
      footers: [
        `TOTAL (${filtered.length} ITEMS)`,
        "",
        "",
        "Total Stock:",
        `Cost Valuation: Rs. ${totalInventoryValue.toLocaleString()}`,
        totalStockQuantity.toLocaleString(),
        "Active Inventory",
      ],
      notes: "Software By Roonjha Developers : 03152914836 - Muslim Construction & Transport Management System",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm no-print">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" />
            Material & Products Inventory Master
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Fuel stocks, crush stone, lubricants, sale prices, cost prices, and low stock indicators
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrintProductsTable}
            className="btn bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-sm transition"
            title="Print material and products inventory table"
          >
            <Printer className="w-4 h-4 text-amber-400" /> Print Ledger
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setForm({
                Name: "",
                Category: "Fuel",
                Unit: "Liters",
                SalePrice: 0,
                PurchasePrice: 0,
                StockQuantity: 0,
                LowStockAlert: 10,
              });
              setShowModal(true);
            }}
            className="btn btn-green text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> + Add Material / Product
          </button>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search material or fuel..."
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
          <div className="p-8 text-center text-slate-500">Loading materials and inventory...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No products or materials found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4 text-right">Sale Price</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Stock Quantity</th>
                  <th className="py-3 px-4 text-center">Stock Alert</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const isLow = p.StockQuantity <= p.LowStockAlert;
                  return (
                    <tr key={p.Id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-800">{p.Name}</td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {p.Category || "General"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.Unit || "Liters"}</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600">
                        Rs. {Number(p.SalePrice || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        Rs. {Number(p.PurchasePrice || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-800 font-mono">
                        {p.StockQuantity}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Adequate
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => handleEdit(p)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition"
                            title="Edit product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.Id, p.Name)}
                            className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                <tr>
                  <td colSpan={3} className="py-3 px-4 font-black uppercase text-xs">
                    Grand Total ({filtered.length} Items)
                  </td>
                  <td className="py-3 px-4 text-right text-xs text-slate-600">
                    Total Stock:
                  </td>
                  <td className="py-3 px-4 text-right font-black text-rose-700 text-sm">
                    Rs. {totalInventoryValue.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-900 text-sm font-mono">
                    {totalStockQuantity.toLocaleString()}
                  </td>
                  <td colSpan={2} className="py-3 px-4 text-center text-xs font-semibold text-slate-600">
                    Asset Value
                  </td>
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
                <Package className="w-4 h-4 text-amber-400" />
                {editingId ? "Edit Product / Material Details" : "Add New Material / Product"}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Item / Material Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.Name}
                  onChange={(e) => setForm({ ...form, Name: e.target.value })}
                  placeholder="e.g. High Speed Diesel or Crush Stone"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={form.Category}
                    onChange={(e) => setForm({ ...form, Category: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option value="Fuel">Fuel (Diesel / Petrol)</option>
                    <option value="Engine Oil">Engine Oil & Lubricants</option>
                    <option value="Construction Material">Construction Material</option>
                    <option value="Spare Parts">Spare Parts</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={form.Unit}
                    onChange={(e) => setForm({ ...form, Unit: e.target.value })}
                    placeholder="Liters, Tons, Dumpers"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sale Price (Rs.)</label>
                  <input
                    type="number"
                    value={form.SalePrice}
                    onChange={(e) =>
                      setForm({ ...form, SalePrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cost Price (Rs.)</label>
                  <input
                    type="number"
                    value={form.PurchasePrice}
                    onChange={(e) =>
                      setForm({ ...form, PurchasePrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Available Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.StockQuantity}
                    onChange={(e) =>
                      setForm({ ...form, StockQuantity: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Low Stock Alert Limit</label>
                  <input
                    type="number"
                    value={form.LowStockAlert}
                    onChange={(e) =>
                      setForm({ ...form, LowStockAlert: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
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
                  {submitting ? "Saving..." : editingId ? "Update Product" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
