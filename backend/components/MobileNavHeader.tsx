"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import SyncStatusBadge from "./SyncStatusBadge";
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
  ShieldCheck,
  LogOut,
  Wallet,
  Building2,
  MapPin,
  Navigation,
} from "lucide-react";

import { triggerPWAInstall } from "@/lib/pwa";
import { openPWAInstallGuide } from "@/components/PWAInstallPrompt";

export function MobileNavHeader({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [companyName, setCompanyName] = useState<string>("Muslim Construction");
  const [tagline, setTagline] = useState<string>("Construction & Transport Management System");
  const pathname = usePathname();
  const router = useRouter();

  // Dynamic Company Branding Loader
  useEffect(() => {
    // 1. Instant local load
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("mc_company_settings");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.companyName) {
            setCompanyName(parsed.companyName);
            if (parsed.tagline) setTagline(parsed.tagline);
          }
        }
      } catch {}
    }

    // 2. Fetch latest from API
    fetch("/api/settings/company")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.companyName) {
          setCompanyName(data.companyName);
          if (data.tagline) setTagline(data.tagline);
          if (typeof window !== "undefined") {
            localStorage.setItem("mc_company_settings", JSON.stringify(data));
          }
        }
      })
      .catch(() => {});

    // 3. Listen to live updates from company profile page
    const handleBrandingUpdate = (e: any) => {
      if (e.detail && e.detail.companyName) {
        setCompanyName(e.detail.companyName);
        if (e.detail.tagline) setTagline(e.detail.tagline);
      }
    };
    window.addEventListener("company_settings_updated", handleBrandingUpdate);
    return () => window.removeEventListener("company_settings_updated", handleBrandingUpdate);
  }, []);

  const handleInstallApp = async () => {
    const res = await triggerPWAInstall();
    if (!res.success) {
      openPWAInstallGuide();
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  };

  // If on Public Landing Page, Login, or Trial Expired, render clean without ERP internal navigation
  if (pathname === "/" || pathname === "/login" || pathname === "/trial-expired") {
    return <>{children}</>;
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-sky-400" },
    { href: "/vehicle-tracking", label: "Vehicle Tracking", icon: Navigation, color: "text-amber-400", highlight: true },
    { href: "/daily-ledger", label: "Daily Ledger", icon: Calendar, color: "text-amber-400" },
    { href: "/din-ka-khulasa", label: "Daily Summary", icon: BarChart3, color: "text-rose-400" },
    { href: "/gari-khata", label: "Vehicle Ledger", icon: Truck, color: "text-blue-400" },
    { href: "/driver-khata", label: "Driver Ledger", icon: UserCheck, color: "text-emerald-400" },
    { href: "/staff", label: "Staff & Labour Ledger", icon: HardHat, color: "text-amber-400" },
    { href: "/customers", label: "Customers", icon: Users, color: "text-purple-400" },
    { href: "/suppliers", label: "Suppliers", icon: Building, color: "text-indigo-400" },
    { href: "/cash", label: "Cash Register", icon: Wallet, color: "text-emerald-400" },
    { href: "/bank", label: "Bank Accounts", icon: Building2, color: "text-sky-400" },
    { href: "/cash-bank", label: "Cash & Bank Vouchers", icon: Receipt, color: "text-teal-400" },
    { href: "/sales", label: "Sales & Invoices", icon: ShoppingCart, color: "text-emerald-400" },
    { href: "/purchases", label: "Purchases", icon: Building, color: "text-blue-400" },
    { href: "/expenses", label: "Daily Expenses", icon: Tag, color: "text-rose-400" },
    { href: "/products", label: "Material & Products", icon: Package, color: "text-amber-400" },
    { href: "/locations", label: "Quarries & Sites", icon: MapPin, color: "text-emerald-300" },
    { href: "/gariyan", label: "Vehicle Master", icon: Database, color: "text-slate-400" },
    { href: "/admin", label: "Admin Portal", icon: ShieldCheck, color: "text-amber-300" },
  ];

  return (
    <>
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50 w-full overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 flex-1 min-w-0 mr-1 sm:mr-3">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition flex-shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {menuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/dashboard" className="flex items-center space-x-1.5 sm:space-x-2 flex-1 min-w-0 truncate group">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-900 text-base sm:text-xl shadow group-hover:bg-amber-400 transition flex-shrink-0">
                🏗️
              </div>
              <div className="min-w-0 truncate">
                <h1 className="text-xs sm:text-base md:text-lg font-bold tracking-tight leading-tight truncate">
                  <span className="sm:hidden">{companyName}</span>
                  <span className="hidden sm:inline">{companyName}</span>
                </h1>
                <p className="hidden md:block text-[11px] text-amber-400 font-medium truncate">
                  {tagline}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {/* Live Online / Offline Sync Badge */}
            <SyncStatusBadge />

            {/* Install App Button - visible on both Mobile and Desktop */}
            <button
              type="button"
              onClick={handleInstallApp}
              className="flex items-center space-x-1 text-[11px] sm:text-xs bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold px-1.5 sm:px-2.5 py-1.5 rounded-lg shadow transition flex-shrink-0"
              title="Install Web App on your phone or PC"
            >
              <Download className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">Install App</span>
            </button>

            {/* Quick New Roznamcha Entry - strictly contained within navbar */}
            <Link
              href="/daily-ledger"
              className="flex items-center space-x-1 text-[11px] sm:text-xs bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black px-2 sm:px-2.5 py-1.5 rounded-lg shadow transition flex-shrink-0 whitespace-nowrap"
              title="Add New Daily Trip Entry"
            >
              <PlusCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">New Entry</span>
              <span className="sm:hidden">Entry</span>
            </Link>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 transition flex-shrink-0"
              title="Sign Out of ERP"
            >
              <LogOut className="w-4 h-4" />
            </button>
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
                Modules & Ledgers
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

            <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={handleLogout}
                className="text-rose-400 font-bold flex items-center gap-1 px-2 py-1 rounded bg-rose-950/40"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
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
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/98 backdrop-blur-md border-t border-slate-800 lg:hidden px-1 py-1.5 flex justify-around items-center safe-area-bottom">
        <Link
          href="/dashboard"
          className={`flex-1 flex flex-col items-center py-1 px-1 rounded-lg text-[10px] font-medium transition text-center truncate ${
            pathname === "/dashboard" ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span className="truncate">Home</span>
        </Link>
        <Link
          href="/daily-ledger"
          className={`flex-1 flex flex-col items-center py-1 px-1 rounded-lg text-[10px] font-medium transition text-center truncate ${
            pathname === "/daily-ledger" ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Calendar className="w-4 h-4 mb-0.5" />
          <span className="truncate">Roznamcha</span>
        </Link>
        <Link
          href="/vehicle-tracking"
          className={`flex-1 flex flex-col items-center py-1 px-1 rounded-lg text-[10px] font-medium transition text-center truncate ${
            pathname === "/vehicle-tracking" ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Navigation className="w-4 h-4 mb-0.5" />
          <span className="truncate">Tracking</span>
        </Link>
        <Link
          href="/din-ka-khulasa"
          className={`flex-1 flex flex-col items-center py-1 px-1 rounded-lg text-[10px] font-medium transition text-center truncate ${
            pathname === "/din-ka-khulasa" ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <BarChart3 className="w-4 h-4 mb-0.5" />
          <span className="truncate">Summary</span>
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className={`flex-1 flex flex-col items-center py-1 px-1 rounded-lg text-[10px] font-medium transition text-center truncate ${
            menuOpen ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Menu className="w-4 h-4 mb-0.5" />
          <span className="truncate">More</span>
        </button>
      </div>

      {/* Global Footer on Every Page */}
      <footer className="bg-white border-t border-slate-200 text-xs text-slate-600 py-4 px-4 text-center mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-800">
            {companyName} & Transport Daily Ledger Management System
          </p>
          <p className="font-bold text-amber-600">
            Software by Roonjha Developers : 03152914836
          </p>
        </div>
      </footer>
    </>
  );
}
