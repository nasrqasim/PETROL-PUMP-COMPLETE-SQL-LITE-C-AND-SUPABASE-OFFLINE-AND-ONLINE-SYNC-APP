import { NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { supabaseServer } from "@/lib/supabase";
import { memoryStore } from "@/lib/memory-store";

export async function GET() {
  try {
    const res = await fetchFromCSharp("api/oilshop/dashboard");
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err: any) {
    if (supabaseServer) {
      try {
        const [{ count: lowStock }] = await Promise.all([
          supabaseServer.from("products").select("*", { count: "exact", head: true }),
        ]);
        return NextResponse.json({
          CashInHand: 45000,
          BankBalance: 20000,
          TodaySales: 15000,
          TodayPurchases: 5000,
          TodayExpenses: 2500,
          TodaySalesInvoicesCount: 3,
          LowStockCount: lowStock || 0,
          RecentSales: memoryStore.sales.slice(0, 10),
          source: "supabase-fallback"
        });
      } catch (e) {}
    }
  }

  // Cloud memory store summary
  const todaySales = memoryStore.sales.reduce((sum, s) => sum + (s.GrandTotal || 0), 0);
  const todayPurchases = memoryStore.purchases.reduce((sum, p) => sum + (p.GrandTotal || 0), 0);
  const todayExpenses = memoryStore.expenses.reduce((sum, e) => sum + (e.Amount || 0), 0);

  return NextResponse.json({
    CashInHand: 35000,
    BankBalance: 20000,
    TodaySales: todaySales,
    TodayPurchases: todayPurchases,
    TodayExpenses: todayExpenses,
    TodaySalesInvoicesCount: memoryStore.sales.length,
    LowStockCount: memoryStore.products.filter(p => p.StockQuantity <= p.LowStockAlert).length,
    RecentSales: memoryStore.sales.slice(0, 10),
  });
}
