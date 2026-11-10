import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { supabaseServer } from "@/lib/supabase";

export async function GET() {
  try {
    const res = await fetchFromCSharp("api/oilshop/staff");
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    if (supabaseServer) {
      const { data, error } = await supabaseServer
        .from("staff")
        .select("*, role:roles(*)")
        .eq("is_deleted", false)
        .order("name");
      if (!error && data) return NextResponse.json(data);
    }
  }

  return NextResponse.json(
    { error: "Could not fetch staff from backend service" },
    { status: 502 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetchFromCSharp("api/oilshop/staff", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create staff member", details: err.message },
      { status: 502 }
    );
  }
}
