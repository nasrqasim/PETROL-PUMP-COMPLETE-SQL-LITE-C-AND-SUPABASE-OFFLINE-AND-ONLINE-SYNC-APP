"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Search, Phone, MapPin, UserPlus, CheckCircle, X, Trash2, Edit2, Printer, Share2 } from "lucide-react";
import { printTableDocument } from "@/lib/print-table";
import {
  createLedgerStatementImageBlob,
  shareOrDownloadWhatsApp,
} from "@/lib/whatsapp-image";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    Name: "",
    Phone: "",
    Address: "",
    NTN: "",
    BalanceDue: 0,
    Advance: 0,
  });

  const loadCustomers = () => {
    setLoading(true);
    fetch("/api/customers")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({ Name: "", Phone: "", Address: "", NTN: "", BalanceDue: 0, Advance: 0 });
    setShowModal(false);
  };

  const handleEdit = (c: any) => {
    setEditingId(c.Id);
    setForm({
      Name: c.Name || "",
      Phone: c.Phone || "",
      Address: c.Address || "",
      NTN: c.NTN || "",
      BalanceDue: Number(c.BalanceDue || 0),
      Advance: Number(c.Advance || 0),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.Name.trim()) return;
    setSubmitting(true);
    try {
      const url = editingId ? `/api/customers/${editingId}` : "/api/customers";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMsg(editingId ? "Customer updated successfully!" : "Customer created successfully!");
        resetForm();
        loadCustomers();
        setTimeout(() => setMsg(""), 3500);
      } else {
        alert("Failed to save customer record.");
      }
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete customer "${name}"?`)) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMsg(`Customer "${name}" deleted successfully.`);
        loadCustomers();
        setTimeout(() => setMsg(""), 3500);
      }
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  const handleShareCustomerWhatsApp = async (c: any) => {
    try {
      const due = Number(c.BalanceDue || 0);
      const adv = Number(c.Advance || 0);
      const netBalance = due - adv;
      const blob = await createLedgerStatementImageBlob({
        title: "CUSTOMER RECEIVABLES STATEMENT",
        subtitle: "Muslim Construction & Transport Client Khata",
        partyName: c.Name,
        partyPhone: c.Phone || undefined,
        dateRange: `As of ${new Date().toLocaleDateString("en-GB")}`,
        openingBalance: 0,
        totalIn: due,
        totalOut: adv,
        closingBalance: netBalance,
        transactions: [
          {
            date: new Date().toLocaleDateString("en-GB"),
            voucher: "CUST-DUE",
            desc: "Current Outstanding Balance Due",
            inAmount: due,
            balance: due,
          },
          ...(adv > 0
            ? [
                {
                  date: new Date().toLocaleDateString("en-GB"),
                  voucher: "ADV-REC",
                  desc: "Advance Deposit Received",
                  outAmount: adv,
                  balance: netBalance,
                },
              ]
            : []),
        ],
      });

      const filename = `Muslim-Construction-Customer-${c.Name.replace(/\s+/g, "_")}.png`;
      const shareTitle = `Customer Ledger: ${c.Name}`;
      const shareText = `*Muslim Construction & Transport*\n*Customer Ledger Statement: ${c.Name}*\nTotal Due: *Rs. ${due.toLocaleString()}*\nAdvance: *Rs. ${adv.toLocaleString()}*\nNet Balance: *Rs. ${netBalance.toLocaleString()}*\n\nSoftware By Roonjha Developers: 03152914836`;

      await shareOrDownloadWhatsApp({
        blob,
        filename,
        shareTitle,
        shareText,
      });
    } catch (err: any) {
      alert("Failed to share on WhatsApp: " + err.message);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.Name?.toLowerCase().includes(search.toLowerCase()) ||
      c.Phone?.toLowerCase().includes(search.toLowerCase())
  );

  const totalBalanceDue = filtered.reduce((acc, c) => acc + Number(c.BalanceDue || 0), 0);
  const totalAdvanceReceived = filtered.reduce((acc, c) => acc + Number(c.Advance || 0), 0);
  const netReceivable = totalBalanceDue - totalAdvanceReceived;

  const handlePrintLedger = () => {
    printTableDocument({
      title: "Customers & Receivables Ledger",
      subtitle: "Customer directories, outstanding balances, advances, and contact records",
      headers: ["#", "Customer Name", "Contact", "Address", "Balance Due", "Advance Received", "Net Status"],
      columnAlignments: ["center", "left", "left", "left", "right", "right", "center"],
      rows: filtered.map((c, idx) => [
        idx + 1,
        c.Name,
        c.Phone || "—",
        c.Address || "—",
        `Rs. ${Number(c.BalanceDue || 0).toLocaleString()}`,
        `Rs. ${Number(c.Advance || 0).toLocaleString()}`,
        Number(c.BalanceDue || 0) > Number(c.Advance || 0) ? "Due" : Number(c.Advance || 0) > 0 ? "Advance" : "Settled",
      ]),
      footers: [
        "",
        `Grand Total (${filtered.length} Customers)`,
        "",
        "",
        `Rs. ${totalBalanceDue.toLocaleString()}`,
        `Rs. ${totalAdvanceReceived.toLocaleString()}`,
        `Net Due: Rs. ${netReceivable.toLocaleString()}`,
      ],
      notes: "Software By Roonjha Developers : 03152914836 - Muslim Construction & Transport Management System",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm no-print">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Customers & Receivables Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Customer directories, outstanding balances, advances, and contact records
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrintLedger}
            className="btn bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-sm transition"
            title="Print entire customers ledger table"
          >
            <Printer className="w-4 h-4 text-amber-400" /> Print Ledger
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setForm({ Name: "", Phone: "", Address: "", NTN: "", BalanceDue: 0, Advance: 0 });
              setShowModal(true);
            }}
            className="btn btn-green text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-4 h-4" /> + Add Customer
          </button>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
          <div className="p-8 text-center text-slate-500">Loading customers...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-right">Advance Received</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.Id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800">{c.Name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {c.Phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {c.Phone}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {c.Address ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {c.Address}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-rose-600">
                      Rs. {Number(c.BalanceDue || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600">
                      Rs. {Number(c.Advance || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleShareCustomerWhatsApp(c)}
                          className="text-emerald-600 hover:text-emerald-800 p-1 rounded hover:bg-emerald-50 transition"
                          title="Share statement on WhatsApp"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(c)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition"
                          title="Edit customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.Id, c.Name)}
                          className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition"
                          title="Delete customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                <tr>
                  <td colSpan={3} className="py-3 px-4 font-black text-slate-900 uppercase text-xs">
                    Grand Total ({filtered.length} Customers)
                  </td>
                  <td className="py-3 px-4 text-right font-black text-rose-700 text-sm">
                    Rs. {totalBalanceDue.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-emerald-700 text-sm">
                    Rs. {totalAdvanceReceived.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center text-xs font-bold text-slate-700">
                    Net: Rs. {netReceivable.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-400" />
                {editingId ? "Edit Customer Details" : "Add New Customer"}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.Name}
                  onChange={(e) => setForm({ ...form, Name: e.target.value })}
                  placeholder="e.g. Al-Madina Builders"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={form.Phone}
                  onChange={(e) => setForm({ ...form, Phone: e.target.value })}
                  placeholder="0300-1234567"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={form.Address}
                  onChange={(e) => setForm({ ...form, Address: e.target.value })}
                  placeholder="City, Area or Project Site"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Opening Balance Due
                  </label>
                  <input
                    type="number"
                    value={form.BalanceDue}
                    onChange={(e) =>
                      setForm({ ...form, BalanceDue: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Advance Payment
                  </label>
                  <input
                    type="number"
                    value={form.Advance}
                    onChange={(e) =>
                      setForm({ ...form, Advance: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-green text-xs font-bold px-5 py-2 flex items-center gap-1.5 shadow"
                >
                  {submitting ? "Saving..." : editingId ? "Update Customer" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
