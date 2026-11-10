import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { supabaseServer } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const endpoint = search ? `api/oilshop/purchases?search=${encodeURIComponent(search)}` : "api/oilshop/purchases";

    const res = await fetchFromCSharp(endpoint);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    if (supabaseServer) {
      const { data, error } = await supabaseServer
        .from("purchase_invoices")
        .select("*, supplier:suppliers(*), lines:purchase_invoice_lines(*)")
        .eq("is_deleted", false)
        .order("date", { ascending: false });
      if (!error && data) return NextResponse.json(data);
    }
  }

  return NextResponse.json(
    { error: "Could not fetch purchase invoices from backend service" },
    { status: 502 }
  );
}
