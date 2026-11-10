import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { supabaseServer } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const endpoint = search ? `api/oilshop/sales?search=${encodeURIComponent(search)}` : "api/oilshop/sales";

    const res = await fetchFromCSharp(endpoint);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    if (supabaseServer) {
      const { data, error } = await supabaseServer
        .from("sales_invoices")
        .select("*, customer:customers(*), lines:sales_invoice_lines(*)")
        .eq("is_deleted", false)
        .order("date", { ascending: false });
      if (!error && data) return NextResponse.json(data);
    }
  }

  return NextResponse.json(
    { error: "Could not fetch sales invoices from backend service" },
    { status: 502 }
  );
}
