"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Clock,
  Calendar,
  AlertTriangle,
  Play,
  Pause,
  Key,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Truck,
  Users,
  LayoutDashboard,
  Database,
  ArrowRight,
  LogOut,
  UserCheck,
  Zap,
  Building2,
  FileSpreadsheet,
  Navigation,
} from "lucide-react";

interface TrialStatusData {
  username: string;
  activated: boolean;
  activationDate: string | null;
  expiryDate: string | null;
  isExpired: boolean;
  isDisabled: boolean;
  remainingDays: number;
  remainingHours: number;
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [trial, setTrial] = useState<TrialStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal / Inputs for credentials change
  const [showCredModal, setShowCredModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/trial");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to load trial status.");
      const data = await res.json();
      setTrial(data);
      setNewUsername(data.username || "trial_user");
    } catch (err: any) {
      setError(err?.message || "Failed to load Super Admin portal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleAction = async (action: string, payload: any = {}) => {
    setUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/auth/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed.");

      setSuccess(data.message || "Action completed successfully.");
      setTrial(data.status);
      setTimeout(() => setSuccess(null), 4000);
      if (action === "update_credentials") {
        setShowCredModal(false);
        setNewPassword("");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update trial account.");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-slate-700 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Super Admin Control Center
              </h1>
              <p className="text-xs text-amber-400 font-semibold flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Permanent Account • Unrestricted Access • Never Expires
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2 max-w-xl">
            You hold master administrative privileges for Muslim Construction. You can manage the single 15-day trial account, activate license cycles, and access all ERP databases.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={loadStatus}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-600 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl flex items-start gap-2.5 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Success</p>
            <p>{success}</p>
          </div>
        </div>
      )}

      {/* Section 1: Single 15-Day Trial Account Controls */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              15-Day Free Trial Account Management
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Strictly limited to exactly ONE trial account. Automatically expires 15 days from server activation.
            </p>
          </div>

          {trial && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                trial.isDisabled
                  ? "bg-rose-100 text-rose-700 border border-rose-200"
                  : trial.isExpired
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}
            >
              {trial.isDisabled
                ? "Disabled by Admin"
                : trial.isExpired
                ? "Trial Expired"
                : `Active (${trial.remainingDays} Days Left)`}
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading trial configuration...</div>
        ) : trial ? (
          <div className="space-y-5">
            {/* Trial Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Assigned Username
                </span>
                <span className="text-base font-black text-slate-900 font-mono mt-1 block">
                  {trial.username}
                </span>
                <span className="text-[10px] text-slate-500">Authorized for client demo</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Activation Date & Time
                </span>
                <span className="text-xs font-bold text-slate-800 mt-1 block">
                  {trial.activationDate ? new Date(trial.activationDate).toLocaleString("en-GB") : "Not Activated"}
                </span>
                <span className="text-[10px] text-slate-500">Recorded on secure server</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Calculated Expiry Date
                </span>
                <span className="text-xs font-bold text-slate-800 mt-1 block">
                  {trial.expiryDate ? new Date(trial.expiryDate).toLocaleString("en-GB") : "N/A"}
                </span>
                <span className="text-[10px] text-slate-500">Strictly enforced server-side</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Remaining Validity
                </span>
                <span className={`text-base font-black mt-1 block ${trial.isExpired ? "text-rose-600" : "text-emerald-700"}`}>
                  {trial.isExpired ? "0 Days (Locked)" : `${trial.remainingDays} Days (${trial.remainingHours} hrs)`}
                </span>
                <span className="text-[10px] text-slate-500">Auto-locks upon expiry</span>
              </div>
            </div>

            {/* Trial Control Action Buttons */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Super Admin Trial Controls
                </h3>
                <p className="text-[11px] text-slate-300">
                  Activate, renew, or disable trial access instantly. Data is never deleted upon expiry.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Activate / Reset 15 Days */}
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleAction("activate", { days: 15 })}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow transition disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{trial.isExpired ? "Re-Activate 15-Day Trial" : "Reset 15 Days"}</span>
                </button>

                {/* Disable / Enable */}
                {trial.isDisabled ? (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleAction("enable")}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Unblock Trial</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleAction("disable")}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition disabled:opacity-50"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Disable Trial</span>
                  </button>
                )}

                {/* Change Credentials */}
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => setShowCredModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs rounded-xl transition disabled:opacity-50"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Change Password</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Section 2: Enterprise Configuration & Auditing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/company-profile"
          className="group bg-gradient-to-br from-white to-amber-50/30 p-5 rounded-3xl border border-amber-200/80 shadow-xs hover:shadow-md transition flex items-start gap-4"
        >
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 group-hover:text-amber-600 transition">
                Company Profile & Branding
              </h3>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-amber-600 transition" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Customize company name, phone, address, and upload custom company logo for all printable vouchers, receipts & WhatsApp statements.
            </p>
            <span className="inline-block mt-2 text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
              Branding & Headers
            </span>
          </div>
        </Link>

        <Link
          href="/admin/audit-log"
          className="group bg-gradient-to-br from-white to-blue-50/30 p-5 rounded-3xl border border-blue-200/80 shadow-xs hover:shadow-md transition flex items-start gap-4"
        >
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition">
                Security & Financial Audit Log
              </h3>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-600 transition" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              View immutable audit trails of customer payments, supplier disbursements, voucher creations, and admin branding updates.
            </p>
            <span className="inline-block mt-2 text-[10px] font-bold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded">
              Tamper-evident Trail
            </span>
          </div>
        </Link>
      </div>

      {/* Section 3: Quick Links to All ERP Modules */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-amber-500" />
            ERP Modules & Management Ledgers
          </h2>
          <p className="text-xs text-slate-500">
            As Super Admin, you have unrestricted, permanent access to all 15 modules.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {[
            { href: "/dashboard", label: "Dashboard", color: "border-sky-200 text-sky-800 bg-sky-50/50" },
            { href: "/daily-ledger", label: "Daily Ledger", color: "border-amber-200 text-amber-900 bg-amber-50/70 font-bold" },
            { href: "/vehicle-tracking", label: "Vehicle Tracking", color: "border-emerald-200 text-emerald-900 bg-emerald-50/70 font-bold" },
            { href: "/din-ka-khulasa", label: "Daily Summary", color: "border-rose-200 text-rose-800 bg-rose-50/50" },
            { href: "/gari-khata", label: "Vehicle Ledger", color: "border-blue-200 text-blue-800 bg-blue-50/50" },
            { href: "/driver-khata", label: "Driver Ledger", color: "border-emerald-200 text-emerald-800 bg-emerald-50/50" },
            { href: "/staff", label: "Staff & Labour", color: "border-purple-200 text-purple-800 bg-purple-50/50" },
            { href: "/customers", label: "Customers", color: "border-indigo-200 text-indigo-800 bg-indigo-50/50" },
            { href: "/suppliers", label: "Suppliers", color: "border-slate-200 text-slate-800 bg-slate-50/50" },
            { href: "/cash-bank", label: "Cash & Bank", color: "border-teal-200 text-teal-800 bg-teal-50/50" },
            { href: "/sales", label: "Sales & Invoices", color: "border-emerald-200 text-emerald-800 bg-emerald-50/50" },
            { href: "/purchases", label: "Purchases", color: "border-blue-200 text-blue-800 bg-blue-50/50" },
            { href: "/expenses", label: "Daily Expenses", color: "border-rose-200 text-rose-800 bg-rose-50/50" },
            { href: "/products", label: "Products Master", color: "border-amber-200 text-amber-800 bg-amber-50/50" },
            { href: "/gariyan", label: "Vehicle Master", color: "border-slate-200 text-slate-800 bg-slate-50/50" },
          ].map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`p-3 rounded-2xl border text-xs font-semibold hover:shadow transition flex items-center justify-between ${m.color}`}
            >
              <span>{m.label}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60" />
            </Link>
          ))}
        </div>
      </div>

      {/* Modal: Change Trial Credentials */}
      {showCredModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              Update Trial Account Credentials
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trial Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new trial password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCredModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updating || (!newUsername.trim() && !newPassword.trim())}
                onClick={() =>
                  handleAction("update_credentials", {
                    newUsername: newUsername.trim(),
                    newPassword: newPassword.trim(),
                  })
                }
                className="flex-1 py-2 text-xs font-black text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow transition disabled:opacity-50"
              >
                {updating ? "Saving..." : "Save Credentials"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
