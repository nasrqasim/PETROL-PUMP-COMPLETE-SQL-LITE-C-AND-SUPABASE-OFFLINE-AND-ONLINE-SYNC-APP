import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";

export async function GET(req: NextRequest, { params }: { params: { gariNo: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const query = new URLSearchParams();
    if (startDate) query.append("startDate", startDate);
    if (endDate) query.append("endDate", endDate);

    const qs = query.toString();
    const endpoint = qs
      ? `api/roznamchareports/vehicle/${encodeURIComponent(params.gariNo)}?${qs}`
      : `api/roznamchareports/vehicle/${encodeURIComponent(params.gariNo)}`;

    const res = await fetchFromCSharp(endpoint);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to generate vehicle ledger report", details: error.message },
      { status: 502 }
    );
  }
}
