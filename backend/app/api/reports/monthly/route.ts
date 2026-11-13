export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { memoryStore } from "@/lib/memory-store";

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
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data);
    }
  } catch (error: any) {
    // Fallback to memoryStore
  }

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = searchParams.get("year") || now.getFullYear().toString();
  const month = searchParams.get("month") || (now.getMonth() + 1).toString().padStart(2, "0");
  const prefix = `${year}-${month.padStart(2, "0")}`;

  const monthEntries = memoryStore.roznamcha.filter((r) => r.date.startsWith(prefix));

  const totalKiraya = monthEntries.reduce((acc, r) => acc + (r.kiraya || 0), 0);
  const totalKharcha = monthEntries.reduce((acc, r) => acc + (r.kharcha || 0), 0);
  const totalAdvance = monthEntries.reduce((acc, r) => acc + (r.advance || 0), 0);
  const totalDieselLiter = monthEntries.reduce((acc, r) => acc + (r.dieselLiter || 0), 0);
  const totalBaqaya = totalKiraya - totalKharcha - totalAdvance;

  return NextResponse.json({
    year: Number(year),
    month: Number(month),
    totalTrips: monthEntries.length,
    totalKiraya,
    totalKharcha,
    totalAdvance,
    totalBaqaya,
    totalDieselLiter,
    entries: monthEntries,
  });
}
