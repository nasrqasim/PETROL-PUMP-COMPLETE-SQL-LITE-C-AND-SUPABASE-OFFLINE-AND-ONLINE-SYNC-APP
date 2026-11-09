import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year") || "";
    const month = searchParams.get("month") || "";

    const query = new URLSearchParams();
    if (year) query.append("year", year);
    if (month) query.append("month", month);

    const qs = query.toString();
    const endpoint = qs ? `api/roznamchareports/monthly?${qs}` : "api/roznamchareports/monthly";

    const res = await fetchFromCSharp(endpoint);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to generate monthly summary report", details: error.message },
      { status: 502 }
    );
  }
}
