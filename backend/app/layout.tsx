import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Building,
  Users,
  Receipt,
  Tag,
  UserCheck,
  Calendar,
  Truck,
  BarChart3,
  Database
} from "lucide-react";

export const metadata: Metadata = {
  title: "Oil Shop & Roznamcha Management System",
  description: "Complete Cloud & Offline Oil Shop, Roznamcha, Vehicle Ledger & Accounting System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ur" dir="ltr">
      <body className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
        {/* Top Header Navbar */}
        <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-900 text-xl shadow group-hover:bg-amber-400 transition">
                  🛢️
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold tracking-tight">
                    Oil Shop & Transport Roznamcha
                  </h1>
                  <p className="text-[11px] text-amber-400 font-medium">
                    آئل شاپ، پٹرول پمپ، گاڑی و ڈرائیور کھاتہ روزنامچہ
                  </p>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-2 text-xs bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-slate-300 font-mono">Next.js Cloud & Local Bridge</span>
              </div>
              <a
                href="http://localhost:5000"
                target="_blank"
                rel="noreferrer"
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded border border-slate-700 transition"
              >
                C# Desktop Web &rarr;
              </a>
            </div>
          </div>

          {/* Unified Primary Navigation Bar */}
          <div className="bg-slate-800 border-t border-slate-700 overflow-x-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <nav className="flex items-center space-x-1 sm:space-x-2 py-2 text-xs sm:text-sm whitespace-nowrap">
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-md font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  <LayoutDashboard className="w-4 h-4 text-sky-400" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/products"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-md font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  <Package className="w-4 h-4 text-amber-400" />
                  <span>Products & Stock</span>
                </Link>

                <Link
                  href="/sales"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-md font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  <ShoppingCart className="w-4 h-4 text-emerald-400" />
                  <span>Sales</span>
                </Link>

                <Link
                  href="/purchases"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-md font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  <Building className="w-4 h-4 text-blue-400" />
                  <span>Purchases</span>
                </Link>

                <Link
                  href="/customers"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-md font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Customers</span>
                </Link>

                <Link
                  href="/suppliers"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-md font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  <Building className="w-4 h-4 text-indigo-400" />
                  <span>Suppliers</span>
                </Link>

                <Link
                  href="/cash-bank"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-md font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  <Receipt className="w-4 h-4 text-teal-400" />
                  <span>Cash & Bank Vouchers</span>
                </Link>

                <Link
                  href="/expenses"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-md font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  <Tag className="w-4 h-4 text-rose-400" />
                  <span>Expenses</span>
                </Link>

                <Link
                  href="/staff"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-md font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  <span>Staff</span>
                </Link>

                <div className="h-5 w-px bg-slate-700 mx-2 hidden lg:block"></div>

                <Link
                  href="/"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-md font-semibold text-amber-300 hover:bg-slate-700 hover:text-white transition"
                >
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Roznamcha (روزنامچہ)</span>
                </Link>

                <Link
                  href="/gari-khata"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-md font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  <Truck className="w-4 h-4 text-blue-400" />
                  <span>Gari Khata</span>
                </Link>

                <Link
                  href="/driver-khata"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-md font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Driver Khata</span>
                </Link>

                <Link
                  href="/din-ka-khulasa"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-md font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  <BarChart3 className="w-4 h-4 text-rose-400" />
                  <span>Din Ka Khulasa</span>
                </Link>

                <Link
                  href="/gariyan"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-md font-semibold text-slate-400 hover:bg-slate-700 hover:text-white transition"
                >
                  <Database className="w-4 h-4 text-slate-400" />
                  <span>Gariyan</span>
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="bg-white border-t border-slate-200 text-xs text-slate-500 py-4 text-center">
          <p>
            Oil Shop & Roznamcha Management System &copy; {new Date().getFullYear()} — Full Next.js & C# Real-Time Accounting
          </p>
        </footer>
      </body>
    </html>
  );
}
