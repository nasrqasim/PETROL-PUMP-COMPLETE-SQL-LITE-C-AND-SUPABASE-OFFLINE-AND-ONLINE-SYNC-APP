export const dynamic = "force-dynamic";

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
      if (data && typeof data === "object") {
        const records = Array.isArray(data.records) ? data.records : (Array.isArray(data.entries) ? data.entries : []);
        return NextResponse.json({
          ...data,
          records: records,
          entries: records,
          totalVehicles: data.totalVehicles ?? new Set(records.map((r: any) => r.gariNo)).size,
          totalTrips: data.totalTrips ?? records.length,
          totalKiraya: data.totalKiraya ?? 0,
          totalKharcha: data.totalKharcha ?? 0,
          totalAdvance: data.totalAdvance ?? 0,
          totalDiesel: data.totalDiesel ?? data.totalDieselLiter ?? 0,
          totalDieselLiter: data.totalDieselLiter ?? data.totalDiesel ?? 0,
          totalBachat: data.totalBachat ?? data.totalBaqaya ?? 0,
          totalBaqaya: data.totalBaqaya ?? data.totalBachat ?? 0,
        });
      }
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
  const totalBachat = totalKiraya - totalKharcha - totalAdvance;
  const uniqueVehicles = new Set(dayEntries.map((r) => r.gariNo)).size;

  const records = dayEntries.map((r) => ({
    id: r.id,
    date: r.date,
    displayDate: r.displayDate || new Date(r.date).toLocaleDateString("en-GB"),
    gariNo: r.gariNo,
    driverName: r.driverName,
    maal: r.maal || "",
    dieselLiter: r.dieselLiter || 0,
    kiraya: r.kiraya || 0,
    kharcha: r.kharcha || 0,
    advance: r.advance || 0,
    baqaya: r.baqaya || 0,
  }));

  return NextResponse.json({
    date: targetDate,
    displayDate: new Date(targetDate).toLocaleDateString("en-GB"),
    totalVehicles: uniqueVehicles,
    totalTrips: dayEntries.length,
    totalKiraya,
    totalKharcha,
    totalAdvance,
    totalDiesel: totalDieselLiter,
    totalDieselLiter,
    totalBachat,
    totalBaqaya: totalBachat,
    records,
    entries: records,
  });
}
