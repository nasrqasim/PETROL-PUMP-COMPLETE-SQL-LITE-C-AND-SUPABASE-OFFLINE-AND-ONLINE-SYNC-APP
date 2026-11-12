import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { memoryStore } from "@/lib/memory-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || "";
    const endpoint = date ? `api/roznamchareports/daily?date=${encodeURIComponent(date)}` : "api/roznamchareports/daily";

    const res = await fetchFromCSharp(endpoint);
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data);
    }
  } catch (error: any) {
    // Fallback to memoryStore
  }

  const { searchParams } = new URL(req.url);
  const targetDate = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const dayEntries = memoryStore.roznamcha.filter((r) => r.date === targetDate);

  const totalKiraya = dayEntries.reduce((acc, r) => acc + (r.kiraya || 0), 0);
  const totalKharcha = dayEntries.reduce((acc, r) => acc + (r.kharcha || 0), 0);
  const totalAdvance = dayEntries.reduce((acc, r) => acc + (r.advance || 0), 0);
  const totalDieselLiter = dayEntries.reduce((acc, r) => acc + (r.dieselLiter || 0), 0);
  const totalBaqaya = totalKiraya - totalKharcha - totalAdvance;

  return NextResponse.json({
    date: targetDate,
    totalTrips: dayEntries.length,
    totalKiraya,
    totalKharcha,
    totalAdvance,
    totalBaqaya,
    totalDieselLiter,
    entries: dayEntries,
  });
}
