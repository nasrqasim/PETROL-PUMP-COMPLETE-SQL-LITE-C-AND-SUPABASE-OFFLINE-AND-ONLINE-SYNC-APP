export const dynamic = "force-dynamic";

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
      if (data && typeof data === "object") {
        const records = Array.isArray(data.records) ? data.records : (Array.isArray(data.entries) ? data.entries : []);
        return NextResponse.json({
          ...data,
          records,
          entries: records,
          gariNo: data.gariNo || gariDecoded,
          driverName: data.driverName || (records[0]?.driverName ?? ""),
          malik: data.malik || "Apni",
          phone: data.phone || "",
          totalTrips: data.totalTrips ?? records.length,
          totalKiraya: data.totalKiraya ?? 0,
          totalKharcha: data.totalKharcha ?? 0,
          totalAdvance: data.totalAdvance ?? 0,
          totalDiesel: data.totalDiesel ?? data.totalDieselLiter ?? 0,
          baqaya: data.baqaya ?? data.totalBaqaya ?? 0,
          totalBaqaya: data.totalBaqaya ?? data.baqaya ?? 0,
        });
      }
    }
  } catch (error: any) {
    // Fallback to memoryStore
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  let gariEntries = memoryStore.roznamcha.filter((r) =>
    r.gariNo.toLowerCase().includes(gariDecoded.toLowerCase())
  );

  if (startDate) {
    gariEntries = gariEntries.filter((r) => r.date >= startDate);
  }
  if (endDate) {
    gariEntries = gariEntries.filter((r) => r.date <= endDate);
  }

  const gariInfo = memoryStore.gariyan.find(
    (g) => g.gariNo.toLowerCase() === gariDecoded.toLowerCase()
  );

  let runningBalance = 0;
  const records = gariEntries.map((r) => {
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

  const totalKiraya = gariEntries.reduce((acc, r) => acc + (r.kiraya || 0), 0);
  const totalKharcha = gariEntries.reduce((acc, r) => acc + (r.kharcha || 0), 0);
  const totalAdvance = gariEntries.reduce((acc, r) => acc + (r.advance || 0), 0);
  const totalDiesel = gariEntries.reduce((acc, r) => acc + (r.dieselLiter || 0), 0);
  const baqaya = totalKiraya - totalKharcha - totalAdvance;

  return NextResponse.json({
    gariNo: gariDecoded,
    driverName: gariInfo?.driverName || (records[0]?.driverName ?? ""),
    malik: gariInfo?.malik || "Apni",
    phone: gariInfo?.phone || "",
    totalTrips: gariEntries.length,
    totalKiraya,
    totalKharcha,
    totalAdvance,
    totalDiesel,
    totalDieselLiter: totalDiesel,
    baqaya,
    totalBaqaya: baqaya,
    records,
    entries: records,
  });
}
