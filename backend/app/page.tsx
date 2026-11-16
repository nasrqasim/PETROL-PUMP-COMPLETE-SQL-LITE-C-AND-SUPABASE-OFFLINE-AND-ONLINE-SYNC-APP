"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Truck,
  HardHat,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  Fuel,
  Coins,
  ArrowRight,
  PhoneCall,
  Clock,
  CheckCircle2,
  Lock,
  ChevronRight,
  Printer,
  Sparkles,
  MapPin,
  FileSpreadsheet,
  Award,
  Users,
} from "lucide-react";

export default function PublicHomePage() {
  const [activeTab, setActiveTab] = useState<"fleet" | "materials" | "erp">("fleet");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* 1. TOP ANNOUNCEMENT / CONTACT BAR */}
      <div className="bg-slate-900 border-b border-slate-800 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-slate-400">
          <div className="flex items-center space-x-4 sm:space-x-6 text-[11px]">
            <div className="flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span>Project Dispatch: <strong>+92 315 2914836</strong></span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Operating Hours: 7:00 AM – 10:00 PM</span>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="text-slate-400">Hub & Lasbela Mining Operations</span>
            <span className="text-slate-600">•</span>
            <Link
              href="/login"
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition"
            >
              <Lock className="w-3 h-3" />
              <span>ERP Staff Login</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. MAIN PUBLIC NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center font-black text-slate-950 text-2xl shadow-lg border border-amber-400/40">
              🏗️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">
                  Muslim Construction
                </span>
                <span className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                  Heavy Fleet & Civil
                </span>
              </div>
              <p className="text-[11px] text-amber-400/90 font-medium tracking-wide">
                Construction & Transport Management System
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-bold uppercase tracking-wider text-slate-300">
            <a href="#about" className="hover:text-amber-400 transition">About Company</a>
            <a href="#services" className="hover:text-amber-400 transition">Services & Fleet</a>
            <a href="#erp" className="hover:text-amber-400 transition">ERP System</a>
            <a href="#operations" className="hover:text-amber-400 transition">Roznamcha Ops</a>
            <a href="#contact" className="hover:text-amber-400 transition">Contact</a>
          </nav>

          {/* Main CTA: Login to System */}
          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:from-amber-600 active:to-amber-700 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Login to System</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION (Inspired by Heavy Excavator & Construction Image) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 py-16 sm:py-24 lg:py-32 border-b border-slate-800">
        {/* Background Decorative Grid and Lighting Effect */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest shadow-sm">
                <HardHat className="w-3.5 h-3.5 text-amber-400" />
                <span>Heavy Infrastructure & Transport Operations</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                We Build Your Future With <span className="text-amber-500 underline decoration-amber-500/50 underline-offset-8">Strength & Precision</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                Pakistan&apos;s premier platform for managing heavy construction projects, dumper & trailer fleets, daily Roznamcha trip dispatches, crushed stone logistics, driver advances, and corporate financials.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/login"
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-2xl transition-all transform hover:scale-105"
                >
                  <Lock className="w-4 h-4" />
                  <span>Login to ERP System</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#services"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm transition"
                >
                  <Truck className="w-4 h-4 text-amber-400" />
                  <span>Explore Machinery & Fleet</span>
                </a>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-center lg:text-left">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white">25+ Ton</div>
                  <div className="text-[11px] text-slate-400">Heavy Dumper Fleet</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-amber-400">10,000+</div>
                  <div className="text-[11px] text-slate-400">Trips Dispatched</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">100% Secure</div>
                  <div className="text-[11px] text-slate-400">Roznamcha Accounts</div>
                </div>
              </div>
            </div>

            {/* Right Visual Card Column */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
                {/* Visual Header */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> Enterprise Fleet Center
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                    LIVE SYSTEM
                  </span>
                </div>

                {/* Simulated Machine Card */}
                <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Heavy Earthmover & Fleet Dispatch</h3>
                      <p className="text-xs text-slate-400">Excavators, Dumpers, Fuel Tankers</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                    <div className="bg-slate-900/60 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">Active Vehicles</span>
                      <strong className="text-slate-200">Dumper #786, LES-992</strong>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">Materials</span>
                      <strong className="text-slate-200">Crush Stone & Diesel</strong>
                    </div>
                  </div>
                </div>

                {/* ERP Feature Highlights */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Instant Daily Roznamcha Entry with 80mm Thermal Slips</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Real-time Running Balance on Vehicle & Driver Ledgers</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Automated Expense & Advance Payment Deductions</span>
                  </div>
                </div>

                {/* Direct Login Button inside Card */}
                <Link
                  href="/login"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 text-xs font-bold transition shadow"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Access Staff & Management Portal</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. COMPANY INTRODUCTION SECTION */}
      <section id="about" className="py-16 sm:py-24 bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              About Muslim Construction
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Leading the Construction & Transport Sector with Integrity
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Founded on the pillars of rock-solid reliability, modern engineering, and transparent financial stewardship. We provide heavy earthwork, aggregates supply, civil infrastructure works, and turnkey transport logistics across Pakistan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Civil & Earthmoving Infrastructure</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Specialized in massive excavation, highway grading, site preparation, and quarry management with high-capacity machinery.
              </p>
            </div>

            <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Dedicated Transport & Dumper Fleet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fleet of multi-axle dumpers, heavy trailers, and fuel tankers operating 24/7 with digital trip tracking and maintenance logs.
              </p>
            </div>

            <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Automated ERP Roznamcha Accounting</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Eliminates paperwork errors with automated trip freight, en-route expenses, diesel consumption, and driver ledger accounts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SERVICES & MANAGEMENT MODULES SHOWCASE */}
      <section id="services" className="py-16 sm:py-24 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                Comprehensive Operations
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-1">
                Management Modules & Fleet Capabilities
              </h2>
            </div>
            <Link
              href="/login"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 self-start md:self-auto"
            >
              <span>Explore live modules inside ERP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Calendar,
                title: "Daily Roznamcha Entry",
                desc: "Record vehicle departures, material details, diesel liters, freight rates, trip kharcha, and advance payments.",
              },
              {
                icon: Truck,
                title: "Vehicle Master & Ledger",
                desc: "Track company-owned and rented vehicles with trip histories, net balance calculations, and maintenance records.",
              },
              {
                icon: Users,
                title: "Driver & Labour Khata",
                desc: "Dedicated driver profiles, per-trip expense reimbursements, salary advances, and running debit/credit balances.",
              },
              {
                icon: Layers,
                title: "Material & Product Master",
                desc: "High Speed Diesel, Petrol, Engine Oil, Crush Stone, Sand with configurable units (Liters, Tons, Dumpers).",
              },
              {
                icon: Printer,
                title: "80mm Thermal Receipt Slip",
                desc: "Print instant professional on-site thermal dispatch slips for drivers and clients with exact financial breakdown.",
              },
              {
                icon: Building2,
                title: "Customers & Mining Clients",
                desc: "Manage corporate builder accounts, running invoices, credit terms, and bank payment clearances.",
              },
              {
                icon: Fuel,
                title: "Diesel Fuel & Suppliers",
                desc: "Track bulk fuel deliveries from PSO/Attock, site consumption, dispenser logs, and supplier payment vouchers.",
              },
              {
                icon: Coins,
                title: "Cash & Bank Treasury",
                desc: "Monitor cash receipts, payment vouchers, site petty cash, bank transfers, and automated ledger audits.",
              },
            ].map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 p-5 rounded-2xl transition hover:shadow-xl space-y-2.5 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-white">{mod.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{mod.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="py-16 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Ready to Access the Muslim Construction ERP?
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-900 max-w-xl">
              Super Admin and 15-Day Trial client accounts can log in now to manage trips, generate 80mm thermal receipts, and audit financials.
            </p>
          </div>
          <Link
            href="/login"
            className="flex-shrink-0 flex items-center gap-2 px-8 py-4 bg-slate-950 hover:bg-slate-900 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-2xl transition transform hover:scale-105"
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Sign In to System</span>
          </Link>
        </div>
      </section>

      {/* 7. PROFESSIONAL PUBLIC FOOTER */}
      <footer id="contact" className="bg-slate-950 border-t border-slate-800 text-xs text-slate-400 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: About */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2.5">
              <span className="text-xl">🏗️</span>
              <span className="text-base font-black text-white tracking-tight uppercase">
                Muslim Construction
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Construction and heavy transport management system. Engineered for high performance, reliability, and precision accounting.
            </p>
          </div>

          {/* Col 2: Fast Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Quick Navigation</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><a href="#about" className="hover:text-amber-400 transition">About Company</a></li>
              <li><a href="#services" className="hover:text-amber-400 transition">Services & Fleet</a></li>
              <li><Link href="/login" className="hover:text-amber-400 transition">Staff ERP Login</Link></li>
              <li><Link href="/daily-ledger" className="hover:text-amber-400 transition">Daily Ledger (Roznamcha)</Link></li>
            </ul>
          </div>

          {/* Col 3: Operations Hub */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Operations & Logistics</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Site Area Hub, Lasbela & Transport Chowk, Pakistan</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Dispatch: 7:00 AM – 10:00 PM Daily</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Software Support Required Info */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Software Engineering</h4>
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1 text-[11px]">
              <span className="text-slate-400 block">Developed & Maintained by:</span>
              <p className="font-bold text-amber-400 text-xs">
                Software By Roonjha Developers : 03152914836
              </p>
              <p className="text-[10px] text-slate-500 pt-1">
                Custom ERP, Roznamcha, PWA & High-load Database Architecture
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Attribution Bar */}
        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-2 text-center text-[11px]">
          <p className="text-slate-500">
            © {new Date().getFullYear()} Muslim Construction. Construction & Transport Management System.
          </p>
          <p className="font-bold text-amber-400">
            Software By Roonjha Developers : 03152914836
          </p>
        </div>
      </footer>
    </div>
  );
}
