"use client";

import React, { useState, useEffect } from "react";
import { Truck, PlusCircle, Edit2, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

interface Gari {
  id: number;
  gariNo: string;
  driverName: string;
  malik: string;
  phone: string;
}

export default function GariyanPage() {
  const [list, setList] = useState<Gari[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [gariNo, setGariNo] = useState("");
  const [driverName, setDriverName] = useState("");
  const [malik, setMalik] = useState("Apni");
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

  useEffect(() => {
    loadVehicles();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setGariNo("");
    setDriverName("");
    setMalik("Apni");
    setPhone("");
  };

  const handleEdit = (g: Gari) => {
    setEditingId(g.id);
    setGariNo(g.gariNo);
    setDriverName(g.driverName);
    setMalik(g.malik);
    setPhone(g.phone);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number, vehicleNo: string) => {
    if (!window.confirm(`Delete vehicle #${vehicleNo}?`)) return;
    try {
      const res = await fetch(`/api/gariyan/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed.");
      setSuccess("Vehicle removed successfully.");
      setTimeout(() => setSuccess(null), 3000);
      loadVehicles();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gariNo.trim()) {
      setError("Vehicle number is required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const url = editingId ? `/api/gariyan/${editingId}` : "/api/gariyan";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gariNo: gariNo.trim(),
          driverName: driverName.trim(),
          malik,
          phone: phone.trim(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to save vehicle.");
      }

      setSuccess(editingId ? "Vehicle updated successfully!" : "Vehicle registered successfully!");
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
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-500" />
            Gariyan Registration (گاڑیاں رجسٹر کریں)
          </h2>
          <p className="text-sm text-slate-500">
            Register and manage vehicles, ownership (Apni / Kiraye Wali), and default assigned drivers.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs">{success}</p>
        </div>
      )}

      {/* Registration Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-amber-400" />
            {editingId ? `Edit Vehicle #${gariNo}` : "Register New Vehicle (نئی گاڑی درج کریں)"}
          </h3>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-xs bg-slate-700 hover:bg-slate-600 px-2.5 py-1 rounded text-slate-200"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gari Number (Vehicle No) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 537 or LES-1234"
                value={gariNo}
                onChange={(e) => setGariNo(e.target.value)}
                required
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Driver (ڈرائیور)
              </label>
              <input
                type="text"
                placeholder="e.g. Iqbal"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Malikiyat (Ownership)
              </label>
              <select
                value={malik}
                onChange={(e) => setMalik(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Apni">Apni (Own — اپنی)</option>
                <option value="Kiraye Wali">Kiraye Wali (Rented — کرائے والی)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number (فون نمبر)
              </label>
              <input
                type="text"
                placeholder="e.g. 0300-1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-lg shadow transition disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update Vehicle" : "Register Vehicle"}
            </button>
          </div>
        </form>
      </div>

      {/* Vehicle Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[11px] tracking-wider font-semibold">
                <th className="py-3 px-3">Vehicle No (گاڑی نمبر)</th>
                <th className="py-3 px-3">Driver Name (ڈرائیور)</th>
                <th className="py-3 px-3">Ownership (ملکیت)</th>
                <th className="py-3 px-3">Phone (فون)</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading registered vehicles...
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No vehicles registered yet.
                  </td>
                </tr>
              ) : (
                list.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {g.gariNo}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{g.driverName || "—"}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                          g.malik === "Apni"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {g.malik}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{g.phone || "—"}</td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        <button
                          onClick={() => handleEdit(g)}
                          className="p-1 hover:bg-slate-100 text-blue-600 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(g.id, g.gariNo)}
                          className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
