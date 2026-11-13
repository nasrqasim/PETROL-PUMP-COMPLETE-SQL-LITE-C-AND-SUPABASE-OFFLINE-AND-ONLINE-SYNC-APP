export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { supabaseServer } from "@/lib/supabase";
import { memoryStore } from "@/lib/memory-store";

export async function GET() {
  try {
    const res = await fetchFromCSharp("api/oilshop/vouchers");
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    if (supabaseServer) {
      try {
        const { data, error } = await supabaseServer
          .from("payments")
          .select("*, customer:customers(*), supplier:suppliers(*), staff:staff(*)")
          .order("date", { ascending: false });
        if (!error && data && data.length > 0) return NextResponse.json(data);
      } catch (e) {}
    }
  }

  return NextResponse.json(memoryStore.vouchers);
}
