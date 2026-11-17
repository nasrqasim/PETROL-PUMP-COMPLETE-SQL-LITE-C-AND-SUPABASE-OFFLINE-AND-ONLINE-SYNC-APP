export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { memoryStore } from "@/lib/memory-store";
import { getCurrentCashBalance } from "@/lib/accounting";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const search = searchParams.get("search");

  let list = [...memoryStore.cashTransactions];

  // Date filtering
  if (startDate || endDate) {
    list = list.filter((t) => {
      if (startDate && t.Date < startDate) return false;
      if (endDate && t.Date > endDate) return false;
      return true;
    });
  }

  // Search filtering
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (t) =>
        t.Description.toLowerCase().includes(q) ||
        t.VoucherNumber.toLowerCase().includes(q) ||
        t.TransactionType.toLowerCase().includes(q) ||
        (t.Reference && t.Reference.toLowerCase().includes(q))
    );
  }

  const currentBalance = getCurrentCashBalance();
  const todayStr = new Date().toISOString().split("T")[0];

  const totalCashIn = memoryStore.cashTransactions.reduce((acc, curr) => acc + (curr.CashIn || 0), 0);
  const totalCashOut = memoryStore.cashTransactions.reduce((acc, curr) => acc + (curr.CashOut || 0), 0);

  const todayCashIn = memoryStore.cashTransactions
    .filter((t) => t.Date === todayStr)
    .reduce((acc, curr) => acc + (curr.CashIn || 0), 0);

  const todayCashOut = memoryStore.cashTransactions
    .filter((t) => t.Date === todayStr)
    .reduce((acc, curr) => acc + (curr.CashOut || 0), 0);

  // Filtered totals
  const filteredIn = list.reduce((acc, curr) => acc + (curr.CashIn || 0), 0);
  const filteredOut = list.reduce((acc, curr) => acc + (curr.CashOut || 0), 0);

  return NextResponse.json({
    currentBalance,
    totalCashIn,
    totalCashOut,
    todayCashIn,
    todayCashOut,
    filteredIn,
    filteredOut,
    transactions: list,
  });
}
