"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserCheck, Search, Phone, Plus, CheckCircle, X, Trash2 } from "lucide-react";

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    Name: "",
    Designation: "Driver",
    Department: "Transport",
    ContactNumber: "",
    Cnic: "",
    Salary: 30000,
  });

  const loadStaff = () => {
    setLoading(true);
    fetch("/api/staff")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setStaff(data))
      .catch(() => setStaff([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.Name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMsg("Staff member added successfully!");
        setShowModal(false);
        setForm({
          Name: "",
          Designation: "Driver",
          Department: "Transport",
          ContactNumber: "",
          Cnic: "",
          Salary: 30000,
        });
        loadStaff();
        setTimeout(() => setMsg(""), 3500);
      }
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete staff/driver "${name}"?`)) return;
    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMsg(`Staff "${name}" deleted.`);
        loadStaff();
        setTimeout(() => setMsg(""), 3500);
      }
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  const filtered = staff.filter(
    (s) =>
      s.Name?.toLowerCase().includes(search.toLowerCase()) ||
      s.Designation?.toLowerCase().includes(search.toLowerCase()) ||
      s.ContactNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-600" />
            Staff & Drivers Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Employees, drivers, assigned vehicle linkages, designations, and salary records
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-green text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> + Add Staff / Driver
          </button>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search staff, driver..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading staff records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No staff members found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">CNIC</th>
                  <th className="py-3 px-4 text-right">Salary</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.Id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800">{s.Name}</td>
                    <td className="py-3 px-4 text-indigo-700 font-semibold">{s.Designation || "Employee"}</td>
                    <td className="py-3 px-4 text-slate-600">{s.Department || "—"}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {s.ContactNumber ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {s.ContactNumber}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">{s.Cnic || "—"}</td>
                    <td className="py-3 px-4 text-right font-black text-slate-800">
                      Rs. {Number(s.Salary || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          s.IsActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {s.IsActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(s.Id, s.Name)}
                        className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition"
                        title="Delete staff"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-400" /> Add New Staff / Driver
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.Name}
                  onChange={(e) => setForm({ ...form, Name: e.target.value })}
                  placeholder="e.g. Tariq Khan"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                  <select
                    value={form.Designation}
                    onChange={(e) => setForm({ ...form, Designation: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Driver">Driver (ڈرائیور)</option>
                    <option value="Senior Driver">Senior Driver</option>
                    <option value="Accountant">Accountant / Munshi</option>
                    <option value="Pump Operator">Pump Operator</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={form.Department}
                    onChange={(e) => setForm({ ...form, Department: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={form.ContactNumber}
                  onChange={(e) => setForm({ ...form, ContactNumber: e.target.value })}
                  placeholder="0300-1234567"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CNIC Number</label>
                  <input
                    type="text"
                    value={form.Cnic}
                    onChange={(e) => setForm({ ...form, Cnic: e.target.value })}
                    placeholder="52101-xxxxxxx-x"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Salary (Rs.)</label>
                  <input
                    type="number"
                    value={form.Salary}
                    onChange={(e) => setForm({ ...form, Salary: parseFloat(e.target.value) || 0 })}
                    placeholder="30000"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-green text-xs font-bold px-5 py-2 flex items-center gap-1.5 shadow"
                >
                  {submitting ? "Saving..." : "Save Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
