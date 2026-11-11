"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Receipt, Search, ArrowUpRight, ArrowDownLeft, Truck, User } from "lucide-react";

export default function CashBankPage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const loadVouchers = () => {
    setLoading(true);
    fetch("/api/vouchers")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setVouchers(data))
      .catch(() => setVouchers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  const filtered = vouchers.filter((v) => {
    const matchesSearch =
      v.VoucherNumber?.toLowerCase().includes(search.toLowerCase()) ||
      v.Remarks?.toLowerCase().includes(search.toLowerCase()) ||
      v.GariNo?.toLowerCase().includes(search.toLowerCase()) ||
      v.DriverName?.toLowerCase().includes(search.toLowerCase()) ||
      v.Customer?.Name?.toLowerCase().includes(search.toLowerCase()) ||
      v.Supplier?.Name?.toLowerCase().includes(search.toLowerCase());

    if (typeFilter === "all") return matchesSearch;
    return matchesSearch && v.PaymentType?.toString() === typeFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-teal-600" />
            Cash & Bank Vouchers / Vehicle Settlement
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cash / Bank payments & receipts, customer collections, vendor payments, and vehicle Baqaya zeroing settlements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            <option value="all">All Vouchers</option>
            <option value="CashPayment">Cash Payment</option>
            <option value="CashReceipt">Cash Receipt</option>
            <option value="BankPayment">Bank Payment</option>
            <option value="BankReceipt">Bank Receipt</option>
          </select>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search voucher, gari, party..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading vouchers...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No vouchers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Voucher #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Party / Vehicle / Driver</th>
                  <th className="py-3 px-4">Description / Remarks</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((v) => {
                  const isPayment = v.PaymentType?.toString().includes("Payment");
                  const partyDisplay =
                    v.GariNo ? (
                      <span className="flex items-center gap-1 font-bold text-blue-700">
                        <Truck className="w-3.5 h-3.5" /> {v.GariNo} {v.DriverName ? `(${v.DriverName})` : ""}
                      </span>
                    ) : v.Customer ? (
                      <span className="font-semibold text-slate-800">Customer: {v.Customer.Name}</span>
                    ) : v.Supplier ? (
                      <span className="font-semibold text-slate-800">Supplier: {v.Supplier.Name}</span>
                    ) : v.Staff ? (
                      <span className="font-semibold text-purple-700 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> Staff: {v.Staff.Name}
                      </span>
                    ) : (
                      <span className="text-slate-500">General</span>
                    );

                  return (
                    <tr key={v.Id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-800">{v.VoucherNumber}</td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {new Date(v.Date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isPayment ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {isPayment ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                          {v.PaymentType}
                        </span>
                      </td>
                      <td className="py-3 px-4">{partyDisplay}</td>
                      <td className="py-3 px-4 text-slate-600 text-xs max-w-xs truncate">{v.Remarks || "—"}</td>
                      <td
                        className={`py-3 px-4 text-right font-black ${
                          isPayment ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        Rs. {Number(v.Amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
