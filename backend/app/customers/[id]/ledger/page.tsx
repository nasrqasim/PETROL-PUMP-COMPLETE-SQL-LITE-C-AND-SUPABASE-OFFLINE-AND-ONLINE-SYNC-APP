"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Users,
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

export default function CustomerLedgerPage() {
  const params = useParams();
  const customerId = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date filters
  const [filter, setFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    nature: "inflow" as "inflow" | "outflow",
    amount: "",
    paymentMethod: "Cash" as "Cash" | "Bank",
    bankAccountId: "",
    date: new Date().toISOString().split("T")[0],
    voucherNumber: "",
    referenceNumber: "",
    narration: "",
  });

  const loadLedger = async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    try {
      let url = `/api/customers/${customerId}/ledger?filter=${filter}`;
      if (filter === "custom" && startDate) url += `&startDate=${startDate}`;
      if (filter === "custom" && endDate) url += `&endDate=${endDate}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to load customer ledger.");
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
  }, [customerId, filter, startDate, endDate]);

  const handlePrint = () => {
    if (!data || !data.customer) return;
    printTableDocument({
      title: `${data.customer.name} — Customer Ledger Statement`,
      subtitle: `Contact: ${data.customer.phone} | Location: ${data.customer.address} | Period: ${filter.toUpperCase()}`,
      headers: [
        "#",
        "Date",
        "Voucher #",
        "Description",
        "Ref",
        "Charges",
        "Payment",
        "Advance",
        "Due",
        "Running Balance",
        "Status",
        "Mode",
      ],
      columnAlignments: [
        "center",
        "center",
        "left",
        "left",
        "center",
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
        t.TripRef || "—",
        Number(t.Charges || t.Debit || 0) > 0 ? `Rs. ${Number(t.Charges || t.Debit).toLocaleString()}` : "—",
        Number(t.Payment || t.Credit || 0) > 0 ? `Rs. ${Number(t.Payment || t.Credit).toLocaleString()}` : "—",
        Number(t.Advance || 0) > 0 ? `Rs. ${Number(t.Advance).toLocaleString()}` : "—",
        Number(t.Due || 0) > 0 ? `Rs. ${Number(t.Due).toLocaleString()}` : "—",
        `Rs. ${Number(t.RunningBalance || 0).toLocaleString()}`,
        t.Status || (Number(t.RunningBalance || 0) > 0 ? "DUE" : Number(t.RunningBalance || 0) < 0 ? "ADVANCE" : "SETTLED"),
        t.PaymentMethod || "Credit",
      ]),
      footers: [
        "",
        "",
        "",
        `Closing Balance (Net: Rs. ${Number(data.summary.closingBalance || 0).toLocaleString()})`,
        "",
        `Rs. ${Number(data.summary.totalCharges || 0).toLocaleString()}`,
        `Rs. ${Number(data.summary.totalPayments || 0).toLocaleString()}`,
        Number(data.summary.closingAdvance || data.summary.currentAdvance || 0) > 0
          ? `Rs. ${Number(data.summary.closingAdvance || data.summary.currentAdvance).toLocaleString()}`
          : "—",
        Number(data.summary.closingDue || data.summary.currentDue || 0) > 0
          ? `Rs. ${Number(data.summary.closingDue || data.summary.currentDue).toLocaleString()}`
          : "—",
        `Rs. ${Number(data.summary.closingBalance || 0).toLocaleString()}`,
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
      "Reference",
      "Charges",
      "Payment",
      "Advance",
      "Due",
      "RunningBalance",
      "Status",
      "PaymentMethod",
    ];
    const rows = data.transactions.map((t: any, idx: number) => [
      idx + 1,
      `"${t.Date}"`,
      `"${t.VoucherNumber}"`,
      `"${(t.Description || "").replace(/"/g, '""')}"`,
      `"${t.TripRef || ""}"`,
      t.Charges || t.Debit || 0,
      t.Payment || t.Credit || 0,
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
    link.setAttribute("download", `Customer-Ledger-${data.customer.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareWhatsApp = async () => {
    if (!data || !data.customer) return;
    try {
      const blob = await createLedgerStatementImageBlob({
        title: "CUSTOMER LEDGER STATEMENT",
        subtitle: "Muslim Construction & Transport Client Khata",
        partyName: data.customer.name,
        partyPhone: data.customer.phone !== "—" ? data.customer.phone : undefined,
        dateRange: `Period: ${filter.toUpperCase()} • As of ${new Date().toLocaleDateString("en-GB")}`,
        openingBalance: data.summary.openingBalance,
        totalIn: data.summary.totalCharges,
        totalOut: data.summary.totalPayments,
        closingBalance: data.summary.closingBalance,
        transactions: (data.transactions || []).slice(-12).map((t: any) => ({
          date: t.Date,
          voucher: t.VoucherNumber,
          desc: t.Description,
          inAmount: Number(t.Charges || t.Debit) || 0,
          outAmount: Number(t.Payment || t.Credit) || 0,
          balance: Number(t.RunningBalance) || 0,
        })),
      });

      const filename = `Customer-${data.customer.name.replace(/\s+/g, "_")}-Ledger.png`;
      const shareTitle = `${data.customer.name} - Ledger Statement`;
      const shareText = `*Muslim Construction & Transport*\n*Customer Ledger: ${data.customer.name}*\nBalance Due: *Rs. ${Number(data.summary.currentDue || 0).toLocaleString()}*\nAdvance: *Rs. ${Number(data.summary.currentAdvance || 0).toLocaleString()}*\nNet Balance: *Rs. ${Number(data.summary.closingBalance || 0).toLocaleString()}*\nStatus: *${data.summary.closingStatus || "SETTLED"}*\n\nSoftware By Roonjha Developers: 03152914836`;

      await shareOrDownloadWhatsApp({
        blob,
        filename,
        shareTitle,
        shareText,
      });
    } catch (err: any) {
      alert("Failed to share ledger on WhatsApp: " + err.message);
    }
  };

  const handleReceivePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(paymentForm.amount);
    if (!amt || amt <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }
    if (paymentForm.paymentMethod === "Bank" && !paymentForm.bankAccountId) {
      alert("Please select a bank account.");
      return;
    }

    setPaymentSubmitting(true);
    try {
      const isOut = paymentForm.nature === "outflow";
      const res = await fetch(`/api/customers/${customerId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          isOutflow: isOut,
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
        throw new Error(errJson.error || "Failed to post payment.");
      }

      setPaymentSuccess(
        isOut
          ? `Disbursement of Rs. ${amt.toLocaleString()} paid to customer successfully!`
          : `Payment of Rs. ${amt.toLocaleString()} recorded successfully!`
      );
      setTimeout(() => {
        setPaymentSuccess(null);
        setShowPaymentModal(false);
        setPaymentForm({
          nature: "inflow",
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

  // Preview calculations for Receive/Disburse Payment form
  const inputAmt = parseFloat(paymentForm.amount) || 0;
  const currentDueVal = data?.summary?.currentDue || 0;
  const currentAdvVal = data?.summary?.currentAdvance || 0;
  let previewDue = currentDueVal;
  let previewAdvance = currentAdvVal;

  if (inputAmt > 0) {
    if (paymentForm.nature === "inflow") {
      if (inputAmt <= currentDueVal) {
        previewDue = currentDueVal - inputAmt;
        previewAdvance = currentAdvVal;
      } else {
        previewDue = 0;
        previewAdvance = currentAdvVal + (inputAmt - currentDueVal);
      }
    } else {
      // Outflow / disbursement to customer
      if (currentAdvVal > 0) {
        if (inputAmt <= currentAdvVal) {
          previewAdvance = currentAdvVal - inputAmt;
          previewDue = 0;
        } else {
          previewAdvance = 0;
          previewDue = currentDueVal + (inputAmt - currentAdvVal);
        }
      } else {
        previewDue = currentDueVal + inputAmt;
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
            href="/customers"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Back to Customers Directory"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {data?.customer ? data.customer.name : "Customer Ledger"}
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                Customer Khata
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive statement of trip charges, sales, cash/bank receipts, and running balances.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Receive Payment</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition"
            title="Share Ledger Statement on WhatsApp"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
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

      {/* Customer Info & Summary KPI Cards */}
      {data?.customer && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Customer Profile Details */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Customer Profile
            </span>
            <div className="space-y-1">
              <h3 className="font-black text-sm text-slate-900">{data.customer.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{data.customer.phone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{data.customer.address}</span>
              </div>
            </div>
          </div>

          {/* Outstanding Due */}
          <div className="bg-gradient-to-br from-rose-50 to-white p-4 rounded-2xl border border-rose-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
              Current Outstanding Due
            </span>
            <div className="text-2xl font-black text-rose-700">
              Rs. {Number(data.summary.currentDue || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-rose-600">Total unpaid customer invoices</p>
          </div>

          {/* Available Advance */}
          <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-2xl border border-emerald-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Available Advance
            </span>
            <div className="text-2xl font-black text-emerald-700">
              Rs. {Number(data.summary.currentAdvance || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-600">Pre-paid advance funds available</p>
          </div>

          {/* Net Closing Balance */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
              Net Account Position
            </span>
            <div className={`text-2xl font-black ${data.summary.closingBalance >= 0 ? "text-amber-400" : "text-rose-400"}`}>
              Rs. {Number(data.summary.closingBalance || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400">
              {data.summary.closingBalance >= 0 ? "Net Receivable by Company" : "Net Advance in Customer Credit"}
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
                <th className="py-3 px-3">Voucher / Entry #</th>
                <th className="py-3 px-3">Description / Narration</th>
                <th className="py-3 px-3">Trip Ref</th>
                <th className="py-3 px-3 text-right">Charges</th>
                <th className="py-3 px-3 text-right">Payment</th>
                <th className="py-3 px-3 text-right text-emerald-400">Advance</th>
                <th className="py-3 px-3 text-right text-rose-400">Due</th>
                <th className="py-3 px-3 text-right">Running Balance</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Loading customer ledger records...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-rose-500 font-bold">
                    {error}
                  </td>
                </tr>
              ) : !data?.transactions || data.transactions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No transactions found in this date period.
                  </td>
                </tr>
              ) : (
                data.transactions.map((tx: any) => (
                  <tr key={tx.Id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-medium text-slate-700 whitespace-nowrap">{tx.Date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">{tx.VoucherNumber}</td>
                    <td className="py-2.5 px-3 text-slate-700">{tx.Description}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">{tx.TripRef || "—"}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                      {Number(tx.Charges || tx.Debit || 0) > 0 ? `Rs. ${Number(tx.Charges || tx.Debit).toLocaleString()}` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                      {Number(tx.Payment || tx.Credit || 0) > 0 ? `Rs. ${Number(tx.Payment || tx.Credit).toLocaleString()}` : "—"}
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
                        {tx.PaymentMethod || "Credit"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {data?.summary && (
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                <tr>
                  <td colSpan={4} className="py-3 px-3 uppercase font-black text-[11px]">
                    Closing Position Summary
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    Rs. {Number(data.summary.totalCharges || 0).toLocaleString()}
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
                    {Number(data.summary.closingDue ?? data.summary.currentDue ?? 0) > 0
                      ? `Rs. ${Number(data.summary.closingDue ?? data.summary.currentDue).toLocaleString()}`
                      : "—"}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 font-mono">
                    Rs. {Number(data.summary.closingBalance || 0).toLocaleString()}
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

      {/* RECEIVE / DISBURSE PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <span>Record Customer Payment / Voucher</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Customer: <strong>{data?.customer?.name}</strong>
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
              <form onSubmit={handleReceivePaymentSubmit} className="p-6 space-y-4 text-xs">
                {/* Transaction Nature Toggle */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transaction Nature *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentForm({ ...paymentForm, nature: "inflow" })}
                      className={`py-2 rounded-xl font-bold border transition text-center ${
                        paymentForm.nature === "inflow"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      + Receive Payment (Inflow)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentForm({ ...paymentForm, nature: "outflow" })}
                      className={`py-2 rounded-xl font-bold border transition text-center ${
                        paymentForm.nature === "outflow"
                          ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      - Pay Customer / Outflow
                    </button>
                  </div>
                </div>

                {/* Outstanding & Advance Summary */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Current Due</span>
                    <strong className="text-sm font-black text-rose-600">
                      Rs. {currentDueVal.toLocaleString()}
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
                    placeholder="e.g. 5000"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full text-sm font-black border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Live Preview of Calculation */}
                {inputAmt > 0 && (
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-slate-800 space-y-1">
                    <div className="flex justify-between">
                      <span>{paymentForm.nature === "inflow" ? "Remaining Due After Payment:" : "New Due After Outflow:"}</span>
                      <strong className="text-rose-700">Rs. {previewDue.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>{paymentForm.nature === "inflow" ? "New Advance Credit:" : "Remaining Advance Credit:"}</span>
                      <strong className="text-emerald-700">Rs. {previewAdvance.toLocaleString()}</strong>
                    </div>
                  </div>
                )}

                {/* Payment Method & Bank Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Method *</label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as "Cash" | "Bank" })
                      }
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white"
                    >
                      <option value="Cash">Cash In Hand</option>
                      <option value="Bank">Bank Deposit / Transfer</option>
                    </select>
                  </div>

                  {paymentForm.paymentMethod === "Bank" ? (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {paymentForm.nature === "inflow" ? "Receiving Bank *" : "Disbursing Bank *"}
                      </label>
                      <select
                        required
                        value={paymentForm.bankAccountId}
                        onChange={(e) => setPaymentForm({ ...paymentForm, bankAccountId: e.target.value })}
                        className="w-full border border-amber-300 rounded-xl px-3 py-2 bg-amber-50/50"
                      >
                        <option value="">Select Bank...</option>
                        {bankAccounts.map((b) => (
                          <option key={b.Id} value={String(b.Id)}>
                            {b.BankName}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Target Account</label>
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
                    <label className="block font-bold text-slate-700 mb-1">Transaction Date</label>
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
                      placeholder="e.g. CHQ-9912 or Cash Slip"
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
                    placeholder="e.g. Running bill cash part payment"
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
                      paymentForm.nature === "inflow"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-rose-600 hover:bg-rose-700"
                    }`}
                  >
                    {paymentSubmitting
                      ? "Recording..."
                      : paymentForm.nature === "inflow"
                      ? "Save Payment Receipt"
                      : "Disburse Payment Out"}
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
