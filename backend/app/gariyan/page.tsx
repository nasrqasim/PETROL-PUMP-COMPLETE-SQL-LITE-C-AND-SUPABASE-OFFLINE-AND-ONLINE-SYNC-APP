"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Truck, PlusCircle, Edit2, Trash2, CheckCircle2, AlertCircle, Printer, BookOpen } from "lucide-react";
import { printTableDocument } from "@/lib/print-table";

interface Vehicle {
  id: number;
  gariNo: string;
  driverName: string;
  malik: string;
  phone: string;
}

export default function VehicleMasterPage() {
  const [list, setList] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [gariNo, setGariNo] = useState("");
  const [driverName, setDriverName] = useState("");
  const [malik, setMalik] = useState("Owned");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gariyan");
      if (!res.ok) throw new Error("Failed to load vehicle list.");
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintVehiclesTable = () => {
    const ownedCount = list.filter((v) => v.malik === "Owned" || v.malik === "Apni").length;
    const rentedCount = list.length - ownedCount;

    printTableDocument({
      title: "Vehicle Registration & Fleet Directory",
      subtitle: "Fleet dumpers, trucks, assigned drivers, and ownership records",
      headers: ["#", "Vehicle Number", "Default Driver", "Ownership Type", "Contact Phone"],
      columnAlignments: ["center", "left", "left", "center", "left"],
      rows: list.map((v, idx) => [
        idx + 1,
        v.gariNo,
        v.driverName || "—",
        v.malik,
        v.phone || "—",
      ]),
      footers: [
        "",
        `TOTAL (${list.length} VEHICLES)`,
        `Owned: ${ownedCount}`,
        `Rented / Other: ${rentedCount}`,
        "Fleet Active",
      ],
      notes: "Software By Roonjha Developers : 03152914836 - Muslim Construction & Transport Management System",
    });
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setGariNo("");
    setDriverName("");
    setMalik("Owned");
    setPhone("");
  };

  const handleEdit = (item: Vehicle) => {
    setEditingId(item.id);
    setGariNo(item.gariNo);
    setDriverName(item.driverName || "");
    setMalik(item.malik || "Owned");
    setPhone(item.phone || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(`Are you sure you want to delete vehicle #${id}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/gariyan/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete vehicle.");
      setSuccess("Vehicle deleted successfully.");
      setTimeout(() => setSuccess(null), 3000);
      loadVehicles();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!gariNo.trim()) {
      setError("Please enter a valid vehicle number.");
      return;
    }

    const payload = {
      gariNo: gariNo.trim(),
      driverName: driverName.trim(),
      malik: malik.trim(),
      phone: phone.trim(),
    };

    setSaving(true);
    try {
      const url = editingId ? `/api/gariyan/${editingId}` : "/api/gariyan";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to save vehicle record.");
      }

      setSuccess(editingId ? "Vehicle updated successfully." : "Vehicle registered successfully.");
      setTimeout(() => setSuccess(null), 3000);
      resetForm();
      loadVehicles();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-600" />
            Vehicle Registration & Master Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Register and manage fleet dumpers, trucks, assigned drivers, and ownership details.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-3 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center space-x-2">
          <PlusCircle className="w-4 h-4 text-amber-500" />
          <span>{editingId ? `Update Vehicle #${editingId}` : "Register New Vehicle"}</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Vehicle Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vehicle Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 786 or LES-992"
                value={gariNo}
                onChange={(e) => setGariNo(e.target.value)}
                className="w-full text-sm font-semibold border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
              />
            </div>

            {/* Default Driver */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Default Driver Name
              </label>
              <input
                type="text"
                placeholder="e.g. Rashid Driver"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Ownership Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ownership Type
              </label>
              <select
                value={malik}
                onChange={(e) => setMalik(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              >
                <option value="Owned">Owned (Company Fleet)</option>
                <option value="Rented">Rented (Contractor / Vendor)</option>
                <option value="Third-Party">Third-Party Transport</option>
              </select>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Phone Number
              </label>
              <input
                type="text"
                placeholder="0300-1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow transition disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update Vehicle" : "Register Vehicle"}
            </button>
          </div>
        </form>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center no-print">
          <h3 className="font-bold text-sm text-slate-800">
            Registered Fleet Vehicles ({list.length})
          </h3>
          <button
            type="button"
            onClick={handlePrintVehiclesTable}
            className="btn bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 shadow-sm transition"
            title="Print fleet vehicles directory table"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" /> Print Directory
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[11px] tracking-wider font-semibold">
                <th className="py-3 px-4">Vehicle ID</th>
                <th className="py-3 px-4">Vehicle Number</th>
                <th className="py-3 px-4">Default Driver</th>
                <th className="py-3 px-4">Ownership</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading registered vehicles...
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No vehicles registered yet.
                  </td>
                </tr>
              ) : (
                list.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-slate-500 font-mono">#{v.id}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {v.gariNo}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{v.driverName || "—"}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          v.malik === "Owned" || v.malik === "Apni"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {v.malik}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{v.phone || "—"}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Link
                          href={`/gari-khata?gariNo=${encodeURIComponent(v.gariNo)}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded transition"
                          title="View complete vehicle ledger"
                        >
                          <BookOpen className="w-3 h-3 text-amber-600" />
                          <span>Ledger</span>
                        </Link>
                        <button
                          onClick={() => handleEdit(v)}
                          title="Edit vehicle"
                          className="p-1 hover:bg-slate-100 text-blue-600 rounded transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          title="Delete vehicle"
                          className="p-1 hover:bg-rose-50 text-rose-600 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
              <tr>
                <td colSpan={3} className="py-3 px-4 font-black uppercase text-xs">
                  Grand Total ({list.length} Vehicles Registered)
                </td>
                <td className="py-3 px-4 text-slate-800">
                  <span className="text-emerald-700 font-bold">Owned: {list.filter((v) => v.malik === "Owned" || v.malik === "Apni").length}</span> |{" "}
                  <span className="text-blue-700 font-bold">Rented: {list.filter((v) => v.malik !== "Owned" && v.malik !== "Apni").length}</span>
                </td>
                <td colSpan={2} className="py-3 px-4 text-center text-xs text-slate-600">
                  Fleet Ready
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
