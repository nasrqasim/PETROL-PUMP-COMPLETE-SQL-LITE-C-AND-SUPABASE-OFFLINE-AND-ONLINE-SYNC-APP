import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || "";
    const endpoint = date ? `api/roznamchareports/daily?date=${encodeURIComponent(date)}` : "api/roznamchareports/daily";

    const res = await fetchFromCSharp(endpoint);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to generate daily summary report", details: error.message },
      { status: 502 }
    );
  }
}
