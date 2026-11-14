"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  Users,
  Building,
  CreditCard,
  Receipt,
  FileSpreadsheet
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>({
    CashInHand: 0,
    BankBalance: 0,
    TodaySales: 0,
    TodayPurchases: 0,
    TodayExpenses: 0,
    TodaySalesInvoicesCount: 0,
    LowStockCount: 0,
    RecentSales: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Links */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <span>🛢️ Oil Shop & Roznamcha Management</span>
          </h2>
          <p className="text-slate-300 text-sm mt-1">
            Complete Real-Time Accounting, Sales, Inventory, Cash/Bank Vouchers & Transport Roznamcha
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/sales"
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow transition flex items-center gap-1.5"
          >
            <ShoppingCart className="w-4 h-4" /> New Sale
          </Link>
          <Link
            href="/cash-bank"
            className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow transition flex items-center gap-1.5"
          >
            <Receipt className="w-4 h-4" /> Vouchers
          </Link>
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow transition flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" /> Roznamcha Entry
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Cash in Hand</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              Rs. {Number(data.CashInHand || 0).toLocaleString()}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Bank Balance</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">
              Rs. {Number(data.BankBalance || 0).toLocaleString()}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Today Sales</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              Rs. {Number(data.TodaySales || 0).toLocaleString()}
            </h3>
            <span className="text-xs text-slate-500">{data.TodaySalesInvoicesCount || 0} invoices</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Low Stock Alert</p>
            <h3 className={`text-2xl font-black mt-1 ${data.LowStockCount > 0 ? "text-rose-600" : "text-slate-800"}`}>
              {data.LowStockCount || 0} Items
            </h3>
            <span className="text-xs text-slate-500">Require Restocking</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Module Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          href="/products"
          className="bg-white hover:bg-slate-50 border border-slate-200 p-4 rounded-xl text-center group transition shadow-sm"
        >
          <div className="w-10 h-10 mx-auto rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
            <Package className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm mt-2">Products & Stock</h4>
          <p className="text-[11px] text-slate-500">Inventory Catalog</p>
        </Link>

        <Link
          href="/sales"
          className="bg-white hover:bg-slate-50 border border-slate-200 p-4 rounded-xl text-center group transition shadow-sm"
        >
          <div className="w-10 h-10 mx-auto rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm mt-2">Sales Invoices</h4>
          <p className="text-[11px] text-slate-500">POS & Billing</p>
        </Link>

        <Link
          href="/purchases"
          className="bg-white hover:bg-slate-50 border border-slate-200 p-4 rounded-xl text-center group transition shadow-sm"
        >
          <div className="w-10 h-10 mx-auto rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
            <Building className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm mt-2">Purchases</h4>
          <p className="text-[11px] text-slate-500">Stock Inwards</p>
        </Link>

        <Link
          href="/customers"
          className="bg-white hover:bg-slate-50 border border-slate-200 p-4 rounded-xl text-center group transition shadow-sm"
        >
          <div className="w-10 h-10 mx-auto rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm mt-2">Customers</h4>
          <p className="text-[11px] text-slate-500">Receivables & Balances</p>
        </Link>

        <Link
          href="/suppliers"
          className="bg-white hover:bg-slate-50 border border-slate-200 p-4 rounded-xl text-center group transition shadow-sm"
        >
          <div className="w-10 h-10 mx-auto rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition">
            <Building className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm mt-2">Suppliers</h4>
          <p className="text-[11px] text-slate-500">Payables & Vendors</p>
        </Link>

        <Link
          href="/cash-bank"
          className="bg-white hover:bg-slate-50 border border-slate-200 p-4 rounded-xl text-center group transition shadow-sm"
        >
          <div className="w-10 h-10 mx-auto rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition">
            <Receipt className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm mt-2">Cash & Bank</h4>
          <p className="text-[11px] text-slate-500">Vehicle Settle & Vouchers</p>
        </Link>
      </div>

      {/* Recent Sales & Operational Summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-base">Recent Sales Invoices</h3>
          <Link href="/sales" className="text-xs text-indigo-600 font-bold hover:underline">
            View All Sales &rarr;
          </Link>
        </div>

        {loading ? (
          <p className="text-slate-500 text-sm py-4">Loading data...</p>
        ) : !data.RecentSales || data.RecentSales.length === 0 ? (
          <p className="text-slate-400 text-sm py-4">No recent sales records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.RecentSales.map((s: any) => (
                  <tr key={s.Id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{s.InvoiceNumber}</td>
                    <td className="py-2.5 px-3 text-slate-600 text-xs">{s.Date}</td>
                    <td className="py-2.5 px-3 text-slate-700">{typeof s.Customer === 'object' ? s.Customer?.Name : s.Customer || "Walk-in"}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                        {s.Mode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-600">
                      Rs. {Number(s.GrandTotal || 0).toLocaleString()}
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
