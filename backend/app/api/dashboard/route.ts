import { NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { supabaseServer } from "@/lib/supabase";

export async function GET() {
  try {
    const res = await fetchFromCSharp("api/oilshop/dashboard");
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err: any) {
    // If local bridge is offline, attempt Supabase fallback if configured
    if (supabaseServer) {
      try {
        const [{ count: lowStock }] = await Promise.all([
          supabaseServer.from("products").select("*", { count: "exact", head: true }),
        ]);
        return NextResponse.json({
          CashInHand: 0,
          BankBalance: 0,
          TodaySales: 0,
          TodayPurchases: 0,
          TodayExpenses: 0,
          TodaySalesInvoicesCount: 0,
          LowStockCount: lowStock || 0,
          RecentSales: [],
          source: "supabase-fallback"
        });
      } catch (e) {
        // Fall through to error
      }
    }
  }

  return NextResponse.json(
    { error: "Failed to connect to Oil Shop backend service" },
    { status: 502 }
  );
}
