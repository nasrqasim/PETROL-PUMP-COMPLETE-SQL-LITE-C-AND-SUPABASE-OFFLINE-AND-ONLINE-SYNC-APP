import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { supabaseServer } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const endpoint = search ? `api/oilshop/expenses?search=${encodeURIComponent(search)}` : "api/oilshop/expenses";

    const res = await fetchFromCSharp(endpoint);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    if (supabaseServer) {
      const { data, error } = await supabaseServer
        .from("expenses")
        .select("*")
        .eq("is_deleted", false)
        .order("date", { ascending: false });
      if (!error && data) return NextResponse.json(data);
    }
  }

  return NextResponse.json(
    { error: "Could not fetch expenses from backend service" },
    { status: 502 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetchFromCSharp("api/oilshop/expenses", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create expense", details: err.message },
      { status: 502 }
    );
  }
}
