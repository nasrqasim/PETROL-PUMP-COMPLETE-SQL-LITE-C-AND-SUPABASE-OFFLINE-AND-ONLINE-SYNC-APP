"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Database,
  Menu,
  X,
  PlusCircle,
  Download,
  HardHat,
} from "lucide-react";

export function MobileNavHeader({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!installPromptEvent) {
      alert("To install on mobile: Open browser menu (⋮ or Share) and tap 'Add to Home Screen' or 'Install App'.");
      return;
    }
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === "accepted") {
      setCanInstall(false);
      setInstallPromptEvent(null);
    }
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-sky-400" },
    { href: "/", label: "Roznamcha (روزنامچہ)", icon: Calendar, color: "text-amber-400", highlight: true },
    { href: "/din-ka-khulasa", label: "Din Ka Khulasa", icon: BarChart3, color: "text-rose-400" },
    { href: "/gari-khata", label: "Gari Khata", icon: Truck, color: "text-blue-400" },
    { href: "/driver-khata", label: "Driver Khata", icon: UserCheck, color: "text-emerald-400" },
    { href: "/staff", label: "Staff & Labour Khata", icon: HardHat, color: "text-amber-400" },
    { href: "/customers", label: "Customers", icon: Users, color: "text-purple-400" },
    { href: "/suppliers", label: "Suppliers", icon: Building, color: "text-indigo-400" },
    { href: "/cash-bank", label: "Cash & Bank", icon: Receipt, color: "text-teal-400" },
    { href: "/sales", label: "Sales & Invoices", icon: ShoppingCart, color: "text-emerald-400" },
    { href: "/purchases", label: "Purchases", icon: Building, color: "text-blue-400" },
    { href: "/expenses", label: "Daily Expenses", icon: Tag, color: "text-rose-400" },
    { href: "/products", label: "Material & Products", icon: Package, color: "text-amber-400" },
    { href: "/gariyan", label: "Gariyan Master", icon: Database, color: "text-slate-400" },
  ];

  return (
    <>
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition"
              aria-label="Toggle Navigation Menu"
            >
              {menuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/dashboard" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-900 text-lg sm:text-xl shadow group-hover:bg-amber-400 transition flex-shrink-0">
                🏗️
              </div>
              <div>
                <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight leading-tight">
                  Muslim Construction
                </h1>
                <p className="text-[10px] sm:text-[11px] text-amber-400 font-medium truncate max-w-[190px] sm:max-w-none">
                  مسلم کنسٹرکشن اینڈ ٹرانسپورٹ روزنامچہ
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {/* Install App Button */}
            <button
              type="button"
              onClick={handleInstallApp}
              className="flex items-center space-x-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1.5 rounded-lg shadow transition"
              title="Install Web App on your phone or PC"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install</span> App
            </button>

            <Link
              href="/"
              className="flex items-center space-x-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg shadow transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Roznamcha</span> Entry
            </Link>
          </div>
        </div>

        {/* Desktop & Tablet Horizontal Bar */}
        <div className="hidden lg:block bg-slate-800 border-t border-slate-700 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center space-x-1 py-1.5 text-xs whitespace-nowrap">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md font-semibold transition ${
                      active
                        ? "bg-amber-500 text-slate-950 shadow-sm"
                        : item.highlight
                        ? "text-amber-300 hover:bg-slate-700 hover:text-white"
                        : "text-slate-200 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? "text-slate-950" : item.color}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        {menuOpen && (
          <div className="lg:hidden bg-slate-800/98 backdrop-blur-md border-t border-slate-700 max-h-[82vh] overflow-y-auto px-4 py-3 space-y-2 animate-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between px-2 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Modules & Khatas (کھاتے)
              </span>
              <button
                type="button"
                onClick={handleInstallApp}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-1 rounded-md"
              >
                <Download className="w-3 h-3" />
                <span>Install Mobile App</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-1.5">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      active
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "bg-slate-900/60 text-slate-200 hover:bg-slate-700"
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-slate-950" : item.color}`} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-700 text-center">
              <p className="text-[11px] font-semibold text-amber-400">
                Software by Roonjha Developers: 03152914836
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-8 pb-20 md:pb-8">
        {children}
      </main>

      {/* Bottom Sticky Mobile Navigation Bar (PWA Style) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 lg:hidden px-2 py-1.5 flex justify-around items-center">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition ${
            pathname === "/dashboard" ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </Link>
        <Link
          href="/"
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition ${
            pathname === "/" ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span>Roznamcha</span>
        </Link>
        <Link
          href="/din-ka-khulasa"
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition ${
            pathname === "/din-ka-khulasa" ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span>Khulasa</span>
        </Link>
        <Link
          href="/staff"
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition ${
            pathname === "/staff" ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <HardHat className="w-5 h-5 mb-0.5" />
          <span>Staff</span>
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition ${
            menuOpen ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </div>

      {/* Global Footer on Every Page */}
      <footer className="bg-white border-t border-slate-200 text-xs text-slate-600 py-4 px-4 text-center mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-800">
            Muslim Construction & Transport Roznamcha Management System
          </p>
          <p className="font-bold text-amber-600">
            Software by Roonjha developers : 03152914836
          </p>
        </div>
      </footer>
    </>
  );
}
