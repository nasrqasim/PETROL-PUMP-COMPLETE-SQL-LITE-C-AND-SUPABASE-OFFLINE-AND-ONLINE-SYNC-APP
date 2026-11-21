"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  Save,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Upload,
  RefreshCw,
  Phone,
  MapPin,
  Mail,
  FileText,
  Lock,
  Sparkles,
} from "lucide-react";

export default function CompanyProfilePage() {
  const [form, setForm] = useState({
    companyName: "Muslim Construction",
    tagline: "Construction & Transport Management System",
    address: "Site Area Hub, Lasbela & Transport Chowk, Pakistan",
    phone: "+92 315 2914836",
    email: "info@muslimconstruction.com",
    description: "Heavy Earthmoving, Aggregate Supply & Transport Logistics",
    logoUrl: "/icons/icon-192x192.png",
    permanentCredit: "Software By Roonjha Developers : 03152914836",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadSettings = async () => {
    // 1. Instant local load from localStorage
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("mc_company_settings");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.companyName) {
            setForm((prev) => ({
              ...prev,
              companyName: parsed.companyName,
              tagline: parsed.tagline || prev.tagline,
              address: parsed.address || prev.address,
              phone: parsed.phone || prev.phone,
              email: parsed.email || prev.email,
              description: parsed.description || prev.description,
              logoUrl: parsed.logoUrl || prev.logoUrl,
            }));
            setLoading(false);
          }
        }
      } catch {}
    }

    setLoading(true);
    try {
      const res = await fetch("/api/settings/company");
      if (res.ok) {
        const data = await res.json();
        const updated = {
          companyName: data.companyName || "Muslim Construction",
          tagline: data.tagline || "Construction & Transport Management System",
          address: data.address || "Site Area Hub, Lasbela & Transport Chowk, Pakistan",
          phone: data.phone || "+92 315 2914836",
          email: data.email || "info@muslimconstruction.com",
          description: data.description || "Heavy Earthmoving, Aggregate Supply & Transport Logistics",
          logoUrl: data.logoUrl || "/icons/icon-192x192.png",
          permanentCredit: "Software By Roonjha Developers : 03152914836",
        };
        setForm(updated);
        if (typeof window !== "undefined") {
          localStorage.setItem("mc_company_settings", JSON.stringify(updated));
        }
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, or SVG).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Logo image size must be under 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm((prev) => ({ ...prev, logoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetDefaultLogo = () => {
    setForm((prev) => ({ ...prev, logoUrl: "/icons/icon-192x192.png" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error("Failed to update company branding.");
      }

      const updated = await res.json().catch(() => form);

      // Save to localStorage & broadcast event so MobileNavHeader updates instantly!
      if (typeof window !== "undefined") {
        localStorage.setItem("mc_company_settings", JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("company_settings_updated", { detail: updated }));
      }

      setMessage({ type: "success", text: "Company branding & profile updated successfully!" });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Back to Admin Portal"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Company Profile & Global Branding
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Control the company name, address, contact, and branding displayed across all documents and receipts.
            </p>
          </div>
        </div>

        <Link
          href="/admin/audit-log"
          className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-xl border border-amber-200 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>View Audit Log</span>
        </Link>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-300 text-emerald-800"
              : "bg-rose-50 border border-rose-300 text-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Profile & Branding Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Logo & Visual Identity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Logo & Visual Preview</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            {/* Visual Logo Preview */}
            <div className="flex flex-col items-center space-y-2">
              <div className="w-24 h-24 rounded-2xl bg-slate-900 border-2 border-amber-500/40 flex items-center justify-center p-2 shadow-lg overflow-hidden">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Company Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-3xl">🏗️</span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Current Logo</span>
            </div>

            {/* Upload & Reset Controls */}
            <div className="space-y-3 flex-1 text-center sm:text-left">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Upload Custom Company Logo</h4>
                <p className="text-xs text-slate-500">
                  Recommended size: 512x512 PNG, SVG, or high-contrast JPG. Max size: 2 MB.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition">
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Choose Image File</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={handleResetDefaultLogo}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Restore Default Logo</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Company Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Company Profile Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Company Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Company / System Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full text-sm font-bold border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Tagline */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Company Tagline / Subtitle</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Primary Project Phone / Hotline *</span>
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Contact Email (Optional)</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Business Address */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Business Operational Address *</span>
              </label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Company Description */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Company Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Permanent Software Attribution (STRICTLY NON-EDITABLE) */}
        <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Permanent Software Engineering Credit</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded">
              LOCKED SYSTEM ATTRIBUTION
            </span>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Official Software Developer:</span>
            <div className="text-base font-black text-amber-400 font-mono tracking-tight">
              Software By Roonjha Developers : 03152914836
            </div>
            <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
              This system attribution is permanent and cannot be modified or removed. It is automatically rendered on all footers, 80mm thermal receipts, customer statements, vendor vouchers, print documents, and WhatsApp shares.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-xl transition transform hover:scale-105 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Updating System..." : "Save Branding Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
