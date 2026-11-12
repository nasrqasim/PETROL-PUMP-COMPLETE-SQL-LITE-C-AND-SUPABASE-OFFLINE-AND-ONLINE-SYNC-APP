import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { memoryStore } from "@/lib/memory-store";

export async function GET(req: NextRequest, { params }: { params: { gariNo: string } }) {
  const gariDecoded = decodeURIComponent(params.gariNo);
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
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data);
    }
  } catch (error: any) {
    // Fallback to memoryStore
  }

  const gariEntries = memoryStore.roznamcha.filter((r) =>
    r.gariNo.toLowerCase().includes(gariDecoded.toLowerCase())
  );

  const totalKiraya = gariEntries.reduce((acc, r) => acc + (r.kiraya || 0), 0);
  const totalKharcha = gariEntries.reduce((acc, r) => acc + (r.kharcha || 0), 0);
  const totalAdvance = gariEntries.reduce((acc, r) => acc + (r.advance || 0), 0);
  const totalDieselLiter = gariEntries.reduce((acc, r) => acc + (r.dieselLiter || 0), 0);
  const totalBaqaya = totalKiraya - totalKharcha - totalAdvance;

  return NextResponse.json({
    gariNo: gariDecoded,
    totalTrips: gariEntries.length,
    totalKiraya,
    totalKharcha,
    totalAdvance,
    totalBaqaya,
    totalDieselLiter,
    entries: gariEntries,
  });
}
