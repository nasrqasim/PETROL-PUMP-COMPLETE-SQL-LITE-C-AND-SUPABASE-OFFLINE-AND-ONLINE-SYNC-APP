export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { memoryStore } from "@/lib/memory-store";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const suppId = Number(params.id);
  const supplier = memoryStore.suppliers.find((s) => Number(s.Id) === suppId);

  if (!supplier) {
    return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "all";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  let rangeStart: string | null = null;
  let rangeEnd: string | null = null;

  if (filter === "today") {
    rangeStart = todayStr;
    rangeEnd = todayStr;
  } else if (filter === "yesterday") {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    rangeStart = yest.toISOString().split("T")[0];
    rangeEnd = yest.toISOString().split("T")[0];
  } else if (filter === "7days") {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    rangeStart = d.toISOString().split("T")[0];
    rangeEnd = todayStr;
  } else if (filter === "thisMonth") {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
    rangeStart = firstDay;
    rangeEnd = todayStr;
  } else if (filter === "lastMonth") {
    const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split("T")[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split("T")[0];
    rangeStart = firstDay;
    rangeEnd = lastDay;
  } else if (filter === "thisYear") {
    rangeStart = `${today.getFullYear()}-01-01`;
    rangeEnd = todayStr;
  } else if (filter === "custom" && (startDate || endDate)) {
    rangeStart = startDate || null;
    rangeEnd = endDate || null;
  }

  // In Supplier Ledger:
  // Credit = Purchases / Inward stock obligations (increases liability)
  // Debit = Payments / Deductions (decreases liability)
  const allTx = memoryStore.supplierLedgers
    .filter((t) => Number(t.SupplierId) === suppId)
    .sort((a, b) => (a.Date > b.Date ? 1 : a.Date < b.Date ? -1 : a.Id - b.Id));

  let openingBalance = 0;
  let filteredTx = allTx;

  if (rangeStart) {
    const priorTx = allTx.filter((t) => t.Date < rangeStart!);
    const priorCredits = priorTx.reduce((sum, t) => sum + (Number(t.Credit) || 0), 0);
    const priorDebits = priorTx.reduce((sum, t) => sum + (Number(t.Debit) || 0), 0);
    openingBalance = priorCredits - priorDebits;

    filteredTx = allTx.filter((t) => {
      if (rangeStart && t.Date < rangeStart) return false;
      if (rangeEnd && t.Date > rangeEnd) return false;
      return true;
    });
  }

  let running = openingBalance;
  const transactionsWithRunning = filteredTx.map((t) => {
    const purchases = Number(t.Credit) || 0;
    const payments = Number(t.Debit) || 0;
    running = running + purchases - payments;

    const runningDue = running > 0 ? running : 0;
    const runningAdvance = running < 0 ? Math.abs(running) : 0;
    const status: "DUE" | "ADVANCE" | "SETTLED" =
      running > 0 ? "DUE" : running < 0 ? "ADVANCE" : "SETTLED";

    return {
      ...t,
      Debit: payments,
      Credit: purchases,
      Purchases: purchases,
      Payment: payments,
      RunningBalance: running,
      Advance: runningAdvance,
      Due: runningDue,
      Status: status,
    };
  });

  const totalPurchases = filteredTx.reduce((sum, t) => sum + (Number(t.Credit) || 0), 0);
  const totalPayments = filteredTx.reduce((sum, t) => sum + (Number(t.Debit) || 0), 0);
  const lastTxDate = allTx.length > 0 ? allTx[allTx.length - 1].Date : null;

  const openingDue = openingBalance > 0 ? openingBalance : 0;
  const openingAdvance = openingBalance < 0 ? Math.abs(openingBalance) : 0;
  const openingStatus = openingBalance > 0 ? "DUE" : openingBalance < 0 ? "ADVANCE" : "SETTLED";

  const closingDue = running > 0 ? running : 0;
  const closingAdvance = running < 0 ? Math.abs(running) : 0;
  const closingStatus = running > 0 ? "DUE" : running < 0 ? "ADVANCE" : "SETTLED";

  return NextResponse.json({
    supplier: {
      id: supplier.Id,
      name: supplier.Name,
      phone: supplier.Phone || "—",
      address: supplier.Address || "—",
      balanceDue: Number(supplier.BalanceDue) || 0,
      advance: Number(supplier.Advance) || 0,
      netPayable: (Number(supplier.BalanceDue) || 0) - (Number(supplier.Advance) || 0),
    },
    summary: {
      openingBalance,
      openingDue,
      openingAdvance,
      openingStatus,
      totalPurchases,
      totalPayments,
      closingPayable: running,
      closingBalance: running,
      closingDue,
      closingAdvance,
      closingStatus,
      currentPayable: Number(supplier.BalanceDue) || 0,
      currentAdvance: Number(supplier.Advance) || 0,
      lastTransactionDate: lastTxDate,
      transactionCount: transactionsWithRunning.length,
    },
    transactions: transactionsWithRunning,
  });
}
