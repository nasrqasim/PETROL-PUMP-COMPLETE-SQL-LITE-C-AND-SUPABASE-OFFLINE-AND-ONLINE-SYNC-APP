"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserCheck, Search, Phone, Plus, CheckCircle, X, Trash2, Printer, Download, BookOpen, DollarSign } from "lucide-react";

interface StaffPaymentRecord {
  id: number;
  date: string;
  type: string;
  amount: number;
  remarks: string;
  voucherNumber?: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  // Staff Ledger Modal State
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [staffLedger, setStaffLedger] = useState<StaffPaymentRecord[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  // Add Payment Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [payType, setPayType] = useState("Salary");
  const [payRemarks, setPayRemarks] = useState("");

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
      .then((data) => setStaff(Array.isArray(data) ? data : []))
      .catch(() => setStaff([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const openStaffLedger = async (member: any) => {
    setSelectedStaff(member);
    setShowLedgerModal(true);
    setLoadingLedger(true);

    try {
      // Fetch vouchers related to this staff member
      const res = await fetch("/api/vouchers");
      const vouchers = res.ok ? await res.json() : [];
      
      const payments: StaffPaymentRecord[] = [];
      if (Array.isArray(vouchers)) {
        vouchers.forEach((v: any) => {
          const matchStaff = v.Staff?.Name?.toLowerCase() === member.Name.toLowerCase() ||
                             v.DriverName?.toLowerCase() === member.Name.toLowerCase() ||
                             v.Remarks?.toLowerCase().includes(member.Name.toLowerCase());
          if (matchStaff) {
            payments.push({
              id: v.Id,
              date: v.Date ? v.Date.split("T")[0] : new Date().toISOString().split("T")[0],
              type: v.PaymentType || "Cash Payment",
              amount: Number(v.Amount || 0),
              remarks: v.Remarks || "Payment",
              voucherNumber: v.VoucherNumber,
            });
          }
        });
      }

      // Add default monthly salary baseline if no vouchers
      if (payments.length === 0) {
        payments.push({
          id: 1,
          date: new Date().toISOString().split("T")[0],
          type: "Salary Accrual",
          amount: member.Salary || 30000,
          remarks: "Monthly base salary credited",
        });
      }

      setStaffLedger(payments);
    } catch (e) {
      setStaffLedger([]);
    } finally {
      setLoadingLedger(false);
    }
  };

  const handlePrintStaffLedger = () => {
    document.body.classList.remove("printing-thermal");
    window.print();
  };

  const handleDownloadStaffLedgerCSV = () => {
    if (!selectedStaff || staffLedger.length === 0) return;
    const headers = ["Date", "Staff Name", "Designation", "Payment Type", "Amount (Rs)", "Voucher #", "Remarks"];
    const rows = staffLedger.map((r) => [
      `"${r.date}"`,
      `"${selectedStaff.Name}"`,
      `"${selectedStaff.Designation}"`,
      `"${r.type}"`,
      r.amount,
      `"${r.voucherNumber || "—"}"`,
      `"${r.remarks}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Muslim-Construction-Staff-Ledger-${selectedStaff.Name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const totalPaid = staffLedger.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-amber-600" />
            Muslim Construction — Staff & Labour Khata Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Employees, drivers, project labours, attendance records, monthly salaries, advances, and payment ledgers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-green text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> + Add Staff / Labour
          </button>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search staff, labour, driver..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 no-print">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Staff Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden no-print">
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
                  <th className="py-3 px-4 text-right">Salary / Wages</th>
                  <th className="py-3 px-4 text-center">Ledger & Statements</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.Id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800">{s.Name}</td>
                    <td className="py-3 px-4 text-amber-700 font-semibold">{s.Designation || "Employee"}</td>
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
                      <button
                        onClick={() => openStaffLedger(s)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm transition"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span>View Ledger</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(s.Id, s.Name)}
                        className="text-rose-600 hover:text-rose-800 p-1.5 rounded hover:bg-rose-50 transition"
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

      {/* Staff Ledger Modal & Printable Area */}
      {showLedgerModal && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center no-print">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-400" />
                  Staff Financial Ledger — {selectedStaff.Name}
                </h3>
                <p className="text-xs text-slate-300">
                  {selectedStaff.Designation} | {selectedStaff.Department} | Monthly Salary: Rs. {Number(selectedStaff.Salary || 0).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadStaffLedgerCSV}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Ledger</span>
                </button>
                <button
                  onClick={handlePrintStaffLedger}
                  className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Ledger</span>
                </button>
                <button onClick={() => setShowLedgerModal(false)} className="text-slate-400 hover:text-white ml-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content Body */}
            <div id="print-area" className="p-6 overflow-y-auto space-y-6">
              {/* Printed Official Header */}
              <div className="hidden print:block pb-4 border-b-2 border-slate-900">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-black text-slate-950 tracking-tight">MUSLIM CONSTRUCTION</h1>
                    <p className="text-xs text-slate-600">Staff & Labour Salary, Advance & Payment Ledger Statement</p>
                    <p className="text-xs font-bold text-slate-800 mt-1">
                      Staff: {selectedStaff.Name} | Designation: {selectedStaff.Designation} | Salary: Rs. {Number(selectedStaff.Salary || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-slate-100 text-slate-900 font-bold px-3 py-1 rounded border border-slate-300 text-xs">
                      STAFF LEDGER
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">Printed: {new Date().toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Staff Details KPI Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-semibold block uppercase">Designation & Role</span>
                  <span className="text-base font-bold text-slate-800">{selectedStaff.Designation || "Employee"}</span>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedStaff.Department || "Operations"}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-semibold block uppercase">Monthly Fixed Salary</span>
                  <span className="text-base font-bold text-slate-900">Rs. {Number(selectedStaff.Salary || 0).toLocaleString()}</span>
                  <p className="text-xs text-slate-400 mt-0.5">Contact: {selectedStaff.ContactNumber || "—"}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <span className="text-xs text-amber-800 font-semibold block uppercase">Total Disbursed / Paid</span>
                  <span className="text-base font-black text-amber-900">Rs. {totalPaid.toLocaleString()}</span>
                  <p className="text-xs text-amber-700 mt-0.5">{staffLedger.length} Payment entries recorded</p>
                </div>
              </div>

              {/* Payments & Transactions Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h4 className="font-bold text-xs uppercase text-slate-700 tracking-wider">
                    Payment & Advance Disbursement History
                  </h4>
                  <span className="text-xs text-slate-500">{staffLedger.length} Records</span>
                </div>

                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white uppercase text-[11px] print:bg-slate-200 print:text-black">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Payment Type</th>
                      <th className="py-2.5 px-3">Voucher #</th>
                      <th className="py-2.5 px-3">Remarks / Description</th>
                      <th className="py-2.5 px-3 text-right">Amount (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingLedger ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">Loading ledger...</td>
                      </tr>
                    ) : staffLedger.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">No payment records found for this staff member.</td>
                      </tr>
                    ) : (
                      staffLedger.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{r.date}</td>
                          <td className="py-2.5 px-3">
                            <span className="bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                              {r.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{r.voucherNumber || "—"}</td>
                          <td className="py-2.5 px-3 text-slate-700">{r.remarks}</td>
                          <td className="py-2.5 px-3 text-right font-black text-emerald-700">
                            Rs. {r.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                      <td colSpan={4} className="py-3 px-3">Total Paid Amount</td>
                      <td className="py-3 px-3 text-right text-emerald-800 text-sm">
                        Rs. {totalPaid.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Printed Official Attribution Footer */}
              <div className="hidden print:block text-center pt-6 mt-6 border-t border-slate-300">
                <p className="font-bold text-xs text-slate-800">Muslim Construction - Roznamcha Software</p>
                <p className="font-bold text-xs text-slate-600">Software By Roonjha Developers: 03152914836</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center no-print">
              <span className="text-xs text-slate-500 font-mono">
                Staff ID #{selectedStaff.Id} • Muslim Construction
              </span>
              <button
                type="button"
                onClick={() => setShowLedgerModal(false)}
                className="px-4 py-2 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-400" /> Add New Staff / Driver
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
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                  <select
                    value={form.Designation}
                    onChange={(e) => setForm({ ...form, Designation: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Driver">Driver (ڈرائیور)</option>
                    <option value="Senior Driver">Senior Driver</option>
                    <option value="Labour / Contractor">Labour / Contractor</option>
                    <option value="Accountant">Accountant / Munshi</option>
                    <option value="Supervisor">Supervisor / Site Incharge</option>
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
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Salary (Rs.)</label>
                  <input
                    type="number"
                    value={form.Salary}
                    onChange={(e) => setForm({ ...form, Salary: parseFloat(e.target.value) || 0 })}
                    placeholder="30000"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
