"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Building,
  Printer,
  Calendar,
  Phone,
  MapPin,
  ArrowLeft,
  Share2,
  Download,
  PlusCircle,
  Coins,
  Wallet,
  CreditCard,
  Building2,
  X,
  CheckCircle,
} from "lucide-react";
import { printTableDocument } from "@/lib/print-table";
import {
  createLedgerStatementImageBlob,
  shareOrDownloadWhatsApp,
} from "@/lib/whatsapp-image";

export default function SupplierLedgerPage() {
  const params = useParams();
  const supplierId = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date filters
  const [filter, setFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pay Supplier Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    nature: "outflow" as "outflow" | "inflow",
    amount: "",
    paymentMethod: "Cash" as "Cash" | "Bank",
    bankAccountId: "",
    date: new Date().toISOString().split("T")[0],
    voucherNumber: "",
    referenceNumber: "",
    narration: "",
  });

  const loadLedger = async () => {
    if (!supplierId) return;
    setLoading(true);
    setError(null);
    try {
      let url = `/api/suppliers/${supplierId}/ledger?filter=${filter}`;
      if (filter === "custom" && startDate) url += `&startDate=${startDate}`;
      if (filter === "custom" && endDate) url += `&endDate=${endDate}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to load supplier ledger.");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Failed to load ledger.");
    } finally {
      setLoading(false);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const res = await fetch("/api/bank-accounts");
      if (res.ok) {
        const b = await res.json();
        setBankAccounts(Array.isArray(b) ? b : []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadLedger();
    loadBankAccounts();
  }, [supplierId, filter, startDate, endDate]);

  const handlePrint = () => {
    if (!data || !data.supplier) return;
    printTableDocument({
      title: `${data.supplier.name} — Supplier & Vendor Ledger Statement`,
      subtitle: `Contact: ${data.supplier.phone} | Address: ${data.supplier.address} | Period: ${filter.toUpperCase()}`,
      headers: [
        "#",
        "Date",
        "Voucher #",
        "Description",
        "Purchases",
        "Payment Paid",
        "Advance",
        "Payable Due",
        "Running Balance",
        "Status",
        "Mode",
      ],
      columnAlignments: [
        "center",
        "center",
        "left",
        "left",
        "right",
        "right",
        "right",
        "right",
        "right",
        "center",
        "center",
      ],
      rows: (data.transactions || []).map((t: any, idx: number) => [
        idx + 1,
        t.Date,
        t.VoucherNumber,
        t.Description,
        Number(t.Purchases || t.Credit || 0) > 0 ? `Rs. ${Number(t.Purchases || t.Credit).toLocaleString()}` : "—",
        Number(t.Payment || t.Debit || 0) > 0 ? `Rs. ${Number(t.Payment || t.Debit).toLocaleString()}` : "—",
        Number(t.Advance || 0) > 0 ? `Rs. ${Number(t.Advance).toLocaleString()}` : "—",
        Number(t.Due || 0) > 0 ? `Rs. ${Number(t.Due).toLocaleString()}` : "—",
        `Rs. ${Number(t.RunningBalance || 0).toLocaleString()}`,
        t.Status || (Number(t.RunningBalance || 0) > 0 ? "DUE" : Number(t.RunningBalance || 0) < 0 ? "ADVANCE" : "SETTLED"),
        t.PaymentMethod || "Cash",
      ]),
      footers: [
        "",
        "",
        "",
        `Closing Position (Net: Rs. ${Number(data.summary.closingPayable || data.summary.closingBalance || 0).toLocaleString()})`,
        `Rs. ${Number(data.summary.totalPurchases || 0).toLocaleString()}`,
        `Rs. ${Number(data.summary.totalPayments || 0).toLocaleString()}`,
        Number(data.summary.closingAdvance ?? data.summary.currentAdvance ?? 0) > 0
          ? `Rs. ${Number(data.summary.closingAdvance ?? data.summary.currentAdvance).toLocaleString()}`
          : "—",
        Number(data.summary.closingDue ?? data.summary.currentPayable ?? 0) > 0
          ? `Rs. ${Number(data.summary.closingDue ?? data.summary.currentPayable).toLocaleString()}`
          : "—",
        `Rs. ${Number(data.summary.closingPayable || data.summary.closingBalance || 0).toLocaleString()}`,
        data.summary.closingStatus || "SETTLED",
        "",
      ],
    });
  };

  const handleExportCSV = () => {
    if (!data || !data.transactions?.length) return;
    const headers = [
      "Index",
      "Date",
      "VoucherNumber",
      "Description",
      "Purchases",
      "PaymentPaid",
      "Advance",
      "PayableDue",
      "RunningBalance",
      "Status",
      "PaymentMethod",
    ];
    const rows = data.transactions.map((t: any, idx: number) => [
      idx + 1,
      `"${t.Date}"`,
      `"${t.VoucherNumber}"`,
      `"${(t.Description || "").replace(/"/g, '""')}"`,
      t.Purchases || t.Credit || 0,
      t.Payment || t.Debit || 0,
      t.Advance || 0,
      t.Due || 0,
      t.RunningBalance || 0,
      `"${t.Status || ""}"`,
      `"${t.PaymentMethod || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encoded = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encoded);
    link.setAttribute("download", `Supplier-Ledger-${data.supplier.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareWhatsApp = async () => {
    if (!data || !data.supplier) return;
    try {
      const blob = await createLedgerStatementImageBlob({
        title: "SUPPLIER VENDOR STATEMENT",
        subtitle: "Muslim Construction & Transport Vendor Khata",
        partyName: data.supplier.name,
        partyPhone: data.supplier.phone !== "—" ? data.supplier.phone : undefined,
        dateRange: `Period: ${filter.toUpperCase()} • As of ${new Date().toLocaleDateString("en-GB")}`,
        openingBalance: data.summary.openingBalance,
        totalIn: data.summary.totalPurchases,
        totalOut: data.summary.totalPayments,
        closingBalance: data.summary.closingPayable,
        transactions: (data.transactions || []).slice(-12).map((t: any) => ({
          date: t.Date,
          voucher: t.VoucherNumber,
          desc: t.Description,
          inAmount: Number(t.Purchases || t.Credit) || 0,
          outAmount: Number(t.Payment || t.Debit) || 0,
          balance: Number(t.RunningBalance) || 0,
        })),
      });

      const filename = `Supplier-${data.supplier.name.replace(/\s+/g, "_")}-Statement.png`;
      const shareTitle = `${data.supplier.name} - Statement`;
      const shareText = `*Muslim Construction & Transport*\n*Supplier / Vendor Statement: ${data.supplier.name}*\nPayable Due: *Rs. ${Number(data.summary.currentPayable || 0).toLocaleString()}*\nAdvance Paid: *Rs. ${Number(data.summary.currentAdvance || 0).toLocaleString()}*\nNet Payable: *Rs. ${Number(data.summary.closingPayable || 0).toLocaleString()}*\nStatus: *${data.summary.closingStatus || "SETTLED"}*\n\nSoftware By Roonjha Developers: 03152914836`;

      await shareOrDownloadWhatsApp({
        blob,
        filename,
        shareTitle,
        shareText,
      });
    } catch (err: any) {
      alert("Failed to share supplier statement on WhatsApp: " + err.message);
    }
  };

  const handlePaySupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(paymentForm.amount);
    if (!amt || amt <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    if (paymentForm.paymentMethod === "Bank" && !paymentForm.bankAccountId) {
      alert("Please select a bank account.");
      return;
    }

    setPaymentSubmitting(true);
    try {
      const isIn = paymentForm.nature === "inflow";
      const res = await fetch(`/api/suppliers/${supplierId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          isInflow: isIn,
          paymentMethod: paymentForm.paymentMethod,
          bankAccountId: paymentForm.bankAccountId,
          date: paymentForm.date,
          voucherNumber: paymentForm.voucherNumber,
          referenceNumber: paymentForm.referenceNumber,
          narration: paymentForm.narration,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to post transaction.");
      }

      setPaymentSuccess(
        isIn
          ? `Recorded refund of Rs. ${amt.toLocaleString()} from ${data.supplier.name} successfully!`
          : `Disbursed Rs. ${amt.toLocaleString()} to ${data.supplier.name} successfully!`
      );
      setTimeout(() => {
        setPaymentSuccess(null);
        setShowPaymentModal(false);
        setPaymentForm({
          nature: "outflow",
          amount: "",
          paymentMethod: "Cash",
          bankAccountId: "",
          date: new Date().toISOString().split("T")[0],
          voucherNumber: "",
          referenceNumber: "",
          narration: "",
        });
        loadLedger();
      }, 1500);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Preview calculations for Pay Supplier form
  const inputAmt = parseFloat(paymentForm.amount) || 0;
  const currentPayableVal = data?.summary?.currentPayable || 0;
  const currentAdvVal = data?.summary?.currentAdvance || 0;
  let previewPayable = currentPayableVal;
  let previewAdvance = currentAdvVal;

  if (inputAmt > 0) {
    if (paymentForm.nature === "outflow") {
      // Disbursing money to supplier
      if (inputAmt <= currentPayableVal) {
        previewPayable = currentPayableVal - inputAmt;
        previewAdvance = currentAdvVal;
      } else {
        previewPayable = 0;
        previewAdvance = currentAdvVal + (inputAmt - currentPayableVal);
      }
    } else {
      // Inflow / refund from supplier
      if (currentAdvVal > 0) {
        if (inputAmt <= currentAdvVal) {
          previewAdvance = currentAdvVal - inputAmt;
          previewPayable = 0;
        } else {
          previewAdvance = 0;
          previewPayable = currentPayableVal + (inputAmt - currentAdvVal);
        }
      } else {
        previewPayable = currentPayableVal + inputAmt;
        previewAdvance = 0;
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center space-x-3">
          <Link
            href="/suppliers"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Back to Suppliers Directory"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {data?.supplier ? data.supplier.name : "Supplier Ledger"}
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">
                Vendor Khata
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Material purchases, diesel tanker deliveries, payments disbursed, and net liability.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Pay Supplier</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition"
            title="Share Statement on WhatsApp"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
            title="Export CSV spreadsheet"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition"
            title="Print Clean Table"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Ledger</span>
          </button>
        </div>
      </div>

      {/* Supplier Info & Summary KPI Cards */}
      {data?.supplier && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Supplier Profile Details */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Supplier / Vendor Profile
            </span>
            <div className="space-y-1">
              <h3 className="font-black text-sm text-slate-900">{data.supplier.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{data.supplier.phone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{data.supplier.address}</span>
              </div>
            </div>
          </div>

          {/* Outstanding Payable */}
          <div className="bg-gradient-to-br from-indigo-50 to-white p-4 rounded-2xl border border-indigo-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
              Outstanding Payable
            </span>
            <div className="text-2xl font-black text-indigo-700">
              Rs. {Number(data.summary.currentPayable || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-indigo-600">Company liability for supplied stock</p>
          </div>

          {/* Available Advance */}
          <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-2xl border border-emerald-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Advance Disbursed
            </span>
            <div className="text-2xl font-black text-emerald-700">
              Rs. {Number(data.summary.currentAdvance || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-600">Pre-paid advance funds to vendor</p>
          </div>

          {/* Net Closing Balance */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
              Net Payable Liability
            </span>
            <div className={`text-2xl font-black ${data.summary.closingPayable >= 0 ? "text-amber-400" : "text-emerald-400"}`}>
              Rs. {Number(data.summary.closingPayable || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400">
              {data.summary.closingPayable >= 0 ? "Net Amount Owed to Vendor" : "Net Advance Paid in Advance"}
            </p>
          </div>
        </div>
      )}

      {/* Date Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs no-print">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-slate-600 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Filter:
          </span>
          {[
            { id: "all", label: "All History" },
            { id: "today", label: "Today" },
            { id: "yesterday", label: "Yesterday" },
            { id: "7days", label: "Last 7 Days" },
            { id: "thisMonth", label: "This Month" },
            { id: "lastMonth", label: "Previous Month" },
            { id: "thisYear", label: "This Year" },
            { id: "custom", label: "Custom Range" },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setFilter(btn.id)}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition ${
                filter === btn.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {filter === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs"
            />
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <span>Transaction Ledger Entries</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-800">
              {data?.transactions?.length || 0} Records
            </span>
          </h3>
          {data?.summary?.openingBalance !== 0 && (
            <span className="text-xs text-slate-600 font-semibold">
              Opening Balance: <strong>Rs. {Number(data?.summary?.openingBalance || 0).toLocaleString()}</strong>
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[11px] tracking-wider font-semibold">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Voucher / Bill #</th>
                <th className="py-3 px-3">Description / Narration</th>
                <th className="py-3 px-3 text-right">Purchases (Bill)</th>
                <th className="py-3 px-3 text-right">Payment Paid</th>
                <th className="py-3 px-3 text-right text-emerald-400">Advance</th>
                <th className="py-3 px-3 text-right text-rose-400">Payable Due</th>
                <th className="py-3 px-3 text-right">Running Balance</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Loading supplier ledger records...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-rose-500 font-bold">
                    {error}
                  </td>
                </tr>
              ) : !data?.transactions || data.transactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No transactions found in this date period.
                  </td>
                </tr>
              ) : (
                data.transactions.map((tx: any) => (
                  <tr key={tx.Id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-medium text-slate-700 whitespace-nowrap">{tx.Date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">{tx.VoucherNumber}</td>
                    <td className="py-2.5 px-3 text-slate-700">{tx.Description}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                      {Number(tx.Purchases || tx.Credit || 0) > 0 ? `Rs. ${Number(tx.Purchases || tx.Credit).toLocaleString()}` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                      {Number(tx.Payment || tx.Debit || 0) > 0 ? `Rs. ${Number(tx.Payment || tx.Debit).toLocaleString()}` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-700">
                      {Number(tx.Advance || 0) > 0 ? `Rs. ${Number(tx.Advance).toLocaleString()}` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-rose-700">
                      {Number(tx.Due || 0) > 0 ? `Rs. ${Number(tx.Due).toLocaleString()}` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900 font-mono">
                      Rs. {Number(tx.RunningBalance || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {tx.Status === "DUE" || (!tx.Status && Number(tx.RunningBalance || 0) > 0) ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                          DUE
                        </span>
                      ) : tx.Status === "ADVANCE" || (!tx.Status && Number(tx.RunningBalance || 0) < 0) ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          ADVANCE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          SETTLED
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {tx.PaymentMethod || "Cash"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {data?.summary && (
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                <tr>
                  <td colSpan={3} className="py-3 px-3 uppercase font-black text-[11px]">
                    Closing Position Summary
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    Rs. {Number(data.summary.totalPurchases || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    Rs. {Number(data.summary.totalPayments || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-emerald-700">
                    {Number(data.summary.closingAdvance ?? data.summary.currentAdvance ?? 0) > 0
                      ? `Rs. ${Number(data.summary.closingAdvance ?? data.summary.currentAdvance).toLocaleString()}`
                      : "—"}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-rose-700">
                    {Number(data.summary.closingDue ?? data.summary.currentPayable ?? 0) > 0
                      ? `Rs. ${Number(data.summary.closingDue ?? data.summary.currentPayable).toLocaleString()}`
                      : "—"}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 font-mono">
                    Rs. {Number(data.summary.closingPayable || data.summary.closingBalance || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${
                        (data.summary.closingStatus || "SETTLED") === "DUE"
                          ? "bg-rose-100 text-rose-800"
                          : (data.summary.closingStatus || "SETTLED") === "ADVANCE"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {data.summary.closingStatus || "SETTLED"}
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* PAY SUPPLIER MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <span>Record Supplier Payment / Voucher</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Vendor: <strong>{data?.supplier?.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentSuccess ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-black text-base text-slate-800">Recorded Successfully!</h4>
                <p className="text-xs text-slate-600">{paymentSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handlePaySupplierSubmit} className="p-6 space-y-4 text-xs">
                {/* Transaction Nature Toggle */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transaction Nature *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentForm({ ...paymentForm, nature: "outflow" })}
                      className={`py-2 rounded-xl font-bold border transition text-center ${
                        paymentForm.nature === "outflow"
                          ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      - Disburse Payment (Outflow)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentForm({ ...paymentForm, nature: "inflow" })}
                      className={`py-2 rounded-xl font-bold border transition text-center ${
                        paymentForm.nature === "inflow"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      + Supplier Refund (Inflow)
                    </button>
                  </div>
                </div>

                {/* Outstanding & Advance Summary */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Current Payable</span>
                    <strong className="text-sm font-black text-indigo-600">
                      Rs. {currentPayableVal.toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Available Advance</span>
                    <strong className="text-sm font-black text-emerald-600">
                      Rs. {currentAdvVal.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Amount (Rs.) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="e.g. 15000"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full text-sm font-black border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Live Preview of Calculation */}
                {inputAmt > 0 && (
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-slate-800 space-y-1">
                    <div className="flex justify-between">
                      <span>{paymentForm.nature === "outflow" ? "Remaining Payable After Payment:" : "New Payable After Refund:"}</span>
                      <strong className="text-indigo-700">Rs. {previewPayable.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>{paymentForm.nature === "outflow" ? "New Advance Balance:" : "Remaining Advance Balance:"}</span>
                      <strong className="text-emerald-700">Rs. {previewAdvance.toLocaleString()}</strong>
                    </div>
                  </div>
                )}

                {/* Payment Method & Bank Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Disbursement Mode *</label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as "Cash" | "Bank" })
                      }
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white"
                    >
                      <option value="Cash">Cash In Hand</option>
                      <option value="Bank">Bank Transfer / Cheque</option>
                    </select>
                  </div>

                  {paymentForm.paymentMethod === "Bank" ? (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Disbursing Bank *</label>
                      <select
                        required
                        value={paymentForm.bankAccountId}
                        onChange={(e) => setPaymentForm({ ...paymentForm, bankAccountId: e.target.value })}
                        className="w-full border border-amber-300 rounded-xl px-3 py-2 bg-amber-50/50"
                      >
                        <option value="">Select Bank Account...</option>
                        {bankAccounts.map((b) => (
                          <option key={b.Id} value={String(b.Id)}>
                            {b.BankName} (Rs. {Number(b.CurrentBalance || 0).toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Source Account</label>
                      <input
                        type="text"
                        disabled
                        value="Main Cash Register"
                        className="w-full border border-slate-200 bg-slate-100 rounded-xl px-3 py-2 text-slate-600 font-semibold"
                      />
                    </div>
                  )}
                </div>

                {/* Payment Date & Reference */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={paymentForm.date}
                      onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ref / Cheque #</label>
                    <input
                      type="text"
                      placeholder="e.g. CHQ-8812 or Bank Ref"
                      value={paymentForm.referenceNumber}
                      onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white"
                    />
                  </div>
                </div>

                {/* Narration */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Narration / Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. HSD fuel tanker payment"
                    value={paymentForm.narration}
                    onChange={(e) => setPaymentForm({ ...paymentForm, narration: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={paymentSubmitting}
                    className={`px-6 py-2 rounded-xl font-black shadow transition disabled:opacity-50 text-white ${
                      paymentForm.nature === "outflow"
                        ? "bg-rose-600 hover:bg-rose-700"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {paymentSubmitting
                      ? "Recording..."
                      : paymentForm.nature === "outflow"
                      ? "Disburse Payment Out"
                      : "Record Supplier Refund"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
