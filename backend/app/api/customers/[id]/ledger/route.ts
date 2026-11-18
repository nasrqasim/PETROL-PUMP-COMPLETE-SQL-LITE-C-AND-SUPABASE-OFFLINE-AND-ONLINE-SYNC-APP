export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { memoryStore } from "@/lib/memory-store";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const custId = Number(params.id);
  const customer = memoryStore.customers.find((c) => Number(c.Id) === custId);

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
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
    const yestStr = yest.toISOString().split("T")[0];
    rangeStart = yestStr;
    rangeEnd = yestStr;
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

  // All customer transactions sorted chronologically
  const allTx = memoryStore.customerLedgers
    .filter((t) => Number(t.CustomerId) === custId)
    .sort((a, b) => (a.Date > b.Date ? 1 : a.Date < b.Date ? -1 : a.Id - b.Id));

  // Compute opening balance before rangeStart
  let openingBalance = 0;
  let filteredTx = allTx;

  if (rangeStart) {
    const priorTx = allTx.filter((t) => t.Date < rangeStart!);
    const priorDebits = priorTx.reduce((sum, t) => sum + (Number(t.Debit) || 0), 0);
    const priorCredits = priorTx.reduce((sum, t) => sum + (Number(t.Credit) || 0), 0);
    openingBalance = priorDebits - priorCredits;

    filteredTx = allTx.filter((t) => {
      if (rangeStart && t.Date < rangeStart) return false;
      if (rangeEnd && t.Date > rangeEnd) return false;
      return true;
    });
  }

  // Recalculate running balance and sequential status through filtered transactions
  let running = openingBalance;
  const transactionsWithRunning = filteredTx.map((t) => {
    const debit = Number(t.Debit) || 0;
    const credit = Number(t.Credit) || 0;
    running = running + debit - credit;

    const runningDue = running > 0 ? running : 0;
    const runningAdvance = running < 0 ? Math.abs(running) : 0;
    const status: "DUE" | "ADVANCE" | "SETTLED" =
      running > 0 ? "DUE" : running < 0 ? "ADVANCE" : "SETTLED";

    return {
      ...t,
      Debit: debit,
      Credit: credit,
      Charges: debit,
      Payment: credit,
      RunningBalance: running,
      Advance: runningAdvance,
      Due: runningDue,
      Status: status,
    };
  });

  const totalCharges = filteredTx.reduce((sum, t) => sum + (Number(t.Debit) || 0), 0);
  const totalPayments = filteredTx.reduce((sum, t) => sum + (Number(t.Credit) || 0), 0);
  const lastTxDate = allTx.length > 0 ? allTx[allTx.length - 1].Date : null;

  const openingDue = openingBalance > 0 ? openingBalance : 0;
  const openingAdvance = openingBalance < 0 ? Math.abs(openingBalance) : 0;
  const openingStatus = openingBalance > 0 ? "DUE" : openingBalance < 0 ? "ADVANCE" : "SETTLED";

  const closingDue = running > 0 ? running : 0;
  const closingAdvance = running < 0 ? Math.abs(running) : 0;
  const closingStatus = running > 0 ? "DUE" : running < 0 ? "ADVANCE" : "SETTLED";

  return NextResponse.json({
    customer: {
      id: customer.Id,
      name: customer.Name,
      phone: customer.Phone || "—",
      address: customer.Address || "—",
      balanceDue: Number(customer.BalanceDue) || 0,
      advance: Number(customer.Advance) || 0,
      netBalance: (Number(customer.BalanceDue) || 0) - (Number(customer.Advance) || 0),
    },
    summary: {
      openingBalance,
      openingDue,
      openingAdvance,
      openingStatus,
      totalCharges,
      totalPayments,
      closingBalance: running,
      closingDue,
      closingAdvance,
      closingStatus,
      currentDue: Number(customer.BalanceDue) || 0,
      currentAdvance: Number(customer.Advance) || 0,
      lastTransactionDate: lastTxDate,
      transactionCount: transactionsWithRunning.length,
    },
    transactions: transactionsWithRunning,
  });
}
