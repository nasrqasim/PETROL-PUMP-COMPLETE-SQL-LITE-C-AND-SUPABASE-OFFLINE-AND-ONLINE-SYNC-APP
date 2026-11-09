import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Truck, Calendar, UserCheck, BarChart3, Database } from "lucide-react";

export const metadata: Metadata = {
  title: "Muslim Construction – Roznamcha",
  description: "Construction transportation Roznamcha & account management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ur" dir="ltr">
      <body className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
        {/* Top Navbar */}
        <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-900 text-xl shadow">
                MC
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Muslim Construction – Roznamcha</h1>
                <p className="text-xs text-amber-400 font-medium">مسلم کنسٹرکشن — روزنامچہ گاڑی و ڈرائیور کھاتہ</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-xs bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-slate-300 font-mono">C# + SQLite + Next.js</span>
              </div>
              <a
                href="http://localhost:5000"
                target="_blank"
                rel="noreferrer"
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded border border-slate-700 transition"
              >
                C# Oil Shop Web &rarr;
              </a>
            </div>
          </div>

          {/* Navigation Bar for the 4 Primary Business Screens */}
          <div className="bg-slate-800 border-t border-slate-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <nav className="flex space-x-1 sm:space-x-4 py-2 overflow-x-auto text-sm">
                <Link
                  href="/"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Aaj Ki Entry (Daily Entry)</span>
                </Link>

                <Link
                  href="/gari-khata"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  <Truck className="w-4 h-4 text-blue-400" />
                  <span>Gari Wise Khata (Vehicle Ledger)</span>
                </Link>

                <Link
                  href="/driver-khata"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Driver Wise Khata (Driver Ledger)</span>
                </Link>

                <Link
                  href="/din-ka-khulasa"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  <BarChart3 className="w-4 h-4 text-rose-400" />
                  <span>Din Ka Khulasa (Daily Summary)</span>
                </Link>

                <Link
                  href="/gariyan"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md font-semibold text-slate-400 hover:bg-slate-700 hover:text-white transition ml-auto"
                >
                  <Database className="w-4 h-4 text-slate-400" />
                  <span>Gariyan (Vehicles)</span>
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>Muslim Construction – Roznamcha &copy; {new Date().getFullYear()}</span>
            <span className="font-mono text-slate-400">Architecture: Next.js + TypeScript + C# ASP.NET Core + SQLite + Supabase</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
