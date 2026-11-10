import { NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { supabaseServer } from "@/lib/supabase";

export async function GET() {
  try {
    const res = await fetchFromCSharp("api/oilshop/vouchers");
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    if (supabaseServer) {
      const { data, error } = await supabaseServer
        .from("payments")
        .select("*, customer:customers(*), supplier:suppliers(*), staff:staff(*)")
        .order("date", { ascending: false });
      if (!error && data) return NextResponse.json(data);
    }
  }

  return NextResponse.json(
    { error: "Could not fetch vouchers from backend service" },
    { status: 502 }
  );
}
