"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, PhoneCall, ShieldCheck, Lock, LogOut, ArrowLeft } from "lucide-react";

export default function TrialExpiredPage() {
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
        {/* Warning Icon Badge */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
          <AlertTriangle className="w-10 h-10 animate-pulse" />
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Lock className="w-3.5 h-3.5" /> Access Restricted
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Your 15-Day Free Trial Has Expired
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed pt-1">
            Your trial access to <strong className="text-amber-400">Muslim Construction Management System</strong> has ended.
          </p>
          <p className="text-xs text-slate-400">
            Please contact the system administrator to continue using the application.
          </p>
        </div>

        {/* Preserved Data Assurance Card */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 text-left space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>All Your Business Data is 100% Preserved</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-normal">
            No records have been deleted. All customer ledgers, supplier balances, vehicle trip records, and daily Roznamcha entries remain safe and securely accessible by the Super Admin.
          </p>
        </div>

        {/* Software Support Contact Card */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-2">
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
            Software Support & License Activation
          </span>
          <div className="text-base sm:text-lg font-black text-white flex items-center justify-center gap-2">
            <PhoneCall className="w-5 h-5 text-amber-400" />
            <a href="tel:03152914836" className="hover:text-amber-300 underline decoration-amber-500 underline-offset-4">
              03152914836
            </a>
          </div>
          <p className="text-xs font-bold text-amber-400">
            Software By Roonjha Developers : 03152914836
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Company Home</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-lg"
          >
            <LogOut className="w-4 h-4" />
            <span>Log In Different User</span>
          </button>
        </div>
      </div>
    </div>
  );
}
