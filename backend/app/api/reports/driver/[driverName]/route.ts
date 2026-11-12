import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { memoryStore } from "@/lib/memory-store";

export async function GET(req: NextRequest, { params }: { params: { driverName: string } }) {
  const driverDecoded = decodeURIComponent(params.driverName);
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const query = new URLSearchParams();
    if (startDate) query.append("startDate", startDate);
    if (endDate) query.append("endDate", endDate);

    const qs = query.toString();
    const endpoint = qs
      ? `api/roznamchareports/driver/${encodeURIComponent(params.driverName)}?${qs}`
      : `api/roznamchareports/driver/${encodeURIComponent(params.driverName)}`;

    const res = await fetchFromCSharp(endpoint);
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data);
    }
  } catch (error: any) {
    // Fallback to memoryStore
  }

  const driverEntries = memoryStore.roznamcha.filter((r) =>
    r.driverName.toLowerCase().includes(driverDecoded.toLowerCase())
  );

  const totalKiraya = driverEntries.reduce((acc, r) => acc + (r.kiraya || 0), 0);
  const totalKharcha = driverEntries.reduce((acc, r) => acc + (r.kharcha || 0), 0);
  const totalAdvance = driverEntries.reduce((acc, r) => acc + (r.advance || 0), 0);
  const totalDieselLiter = driverEntries.reduce((acc, r) => acc + (r.dieselLiter || 0), 0);
  const totalBaqaya = totalKiraya - totalKharcha - totalAdvance;

  return NextResponse.json({
    driverName: driverDecoded,
    totalTrips: driverEntries.length,
    totalKiraya,
    totalKharcha,
    totalAdvance,
    totalBaqaya,
    totalDieselLiter,
    entries: driverEntries,
  });
}
