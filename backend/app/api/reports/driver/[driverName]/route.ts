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
      if (data && typeof data === "object") {
        const records = Array.isArray(data.records) ? data.records : (Array.isArray(data.entries) ? data.entries : []);
        const vehiclesOperated = Array.isArray(data.vehiclesOperated)
          ? data.vehiclesOperated
          : Array.from(new Set(records.map((r: any) => r.gariNo)));
        return NextResponse.json({
          ...data,
          records,
          entries: records,
          vehiclesOperated,
          driverName: data.driverName || driverDecoded,
          totalWorkingDays: data.totalWorkingDays ?? new Set(records.map((r: any) => r.date)).size,
          totalTrips: data.totalTrips ?? records.length,
          totalKiraya: data.totalKiraya ?? 0,
          totalKharcha: data.totalKharcha ?? 0,
          totalAdvance: data.totalAdvance ?? 0,
          totalDiesel: data.totalDiesel ?? data.totalDieselLiter ?? 0,
          driverBaqaya: data.driverBaqaya ?? data.totalBaqaya ?? 0,
          totalBaqaya: data.totalBaqaya ?? data.driverBaqaya ?? 0,
        });
      }
    }
  } catch (error: any) {
    // Fallback to memoryStore
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  let driverEntries = memoryStore.roznamcha.filter((r) =>
    r.driverName.toLowerCase().includes(driverDecoded.toLowerCase())
  );

  if (startDate) {
    driverEntries = driverEntries.filter((r) => r.date >= startDate);
  }
  if (endDate) {
    driverEntries = driverEntries.filter((r) => r.date <= endDate);
  }

  let runningBalance = 0;
  const records = driverEntries.map((r) => {
    const kiraya = r.kiraya || 0;
    const kharcha = r.kharcha || 0;
    const advance = r.advance || 0;
    const entryBaqaya = kiraya - kharcha - advance;
    runningBalance += entryBaqaya;
    return {
      id: r.id,
      date: r.date,
      displayDate: r.displayDate || new Date(r.date).toLocaleDateString("en-GB"),
      gariNo: r.gariNo,
      driverName: r.driverName,
      maal: r.maal || "",
      dieselLiter: r.dieselLiter || 0,
      kiraya,
      kharcha,
      advance,
      entryBaqaya,
      runningBalance,
    };
  });

  const totalKiraya = driverEntries.reduce((acc, r) => acc + (r.kiraya || 0), 0);
  const totalKharcha = driverEntries.reduce((acc, r) => acc + (r.kharcha || 0), 0);
  const totalAdvance = driverEntries.reduce((acc, r) => acc + (r.advance || 0), 0);
  const totalDiesel = driverEntries.reduce((acc, r) => acc + (r.dieselLiter || 0), 0);
  const driverBaqaya = totalKiraya - totalKharcha - totalAdvance;
  const vehiclesOperated = Array.from(new Set(driverEntries.map((r) => r.gariNo)));
  const totalWorkingDays = new Set(driverEntries.map((r) => r.date)).size;

  return NextResponse.json({
    driverName: driverDecoded,
    totalWorkingDays,
    totalTrips: driverEntries.length,
    vehiclesOperated,
    totalKiraya,
    totalKharcha,
    totalAdvance,
    totalDiesel,
    totalDieselLiter: totalDiesel,
    driverBaqaya,
    totalBaqaya: driverBaqaya,
    records,
    entries: records,
  });
}
