"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  HardHat,
  Truck,
  CheckCircle2,
  Download,
} from "lucide-react";
import { triggerPWAInstall } from "@/lib/pwa";
import { openPWAInstallGuide } from "@/components/PWAInstallPrompt";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInstallClick = async () => {
    const res = await triggerPWAInstall();
    if (!res.success) {
      openPWAInstallGuide();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Please enter both User ID and Password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "trial_expired") {
          router.push("/trial-expired");
          return;
        }
        throw new Error(data.message || data.error || "Login failed.");
      }

      // Successful login
      if (data.user?.role === "superadmin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-black text-slate-950 text-xl shadow-md">
              🏗️
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">
                Muslim Construction
              </h1>
              <p className="text-[11px] text-amber-400 font-semibold">
                Construction & Transport Management System
              </p>
            </div>
          </Link>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition shadow"
              title="Install Web App on your phone or PC"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white font-semibold transition"
            >
              ← Back
            </Link>
          </div>
        </div>
      </header>

      {/* Main Login Card Section */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-1">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Sign In to ERP System
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Enter your authorized credentials to access Roznamcha, fleet ledgers, and financial accounts.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authentication Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User ID Field */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">
                User ID / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. admin or trial_user"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3 h-3" /> Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" /> Show
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:from-amber-600 active:to-amber-700 text-slate-950 font-black text-sm rounded-xl shadow-lg transition disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to System</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Account Types Note */}
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Permanent Super Admin & 15-Day Trial Support</span>
            </div>
            <p className="text-[10px] text-slate-500">
              Only authorized staff and client trial accounts are permitted. All sign-in attempts are logged and monitored.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Required by User */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-4 px-4 text-center">
        <p className="text-xs font-bold text-amber-400">
          Software By Roonjha Developers : 03152914836
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Muslim Construction & Transport Management System • All Rights Reserved
        </p>
      </footer>
    </div>
  );
}
