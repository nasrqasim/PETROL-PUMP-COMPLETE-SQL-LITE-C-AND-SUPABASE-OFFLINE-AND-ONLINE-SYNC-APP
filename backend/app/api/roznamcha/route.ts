export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { RoznamchaSchema } from "@/lib/validations";
import { memoryStore } from "@/lib/memory-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const endpoint = queryString ? `api/roznamcha?${queryString}` : "api/roznamcha";

    const res = await fetchFromCSharp(endpoint);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    // Fallback to cloud memory store
  }

  // Fallback to memory store
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const gariNo = searchParams.get("gariNo");

  let list = [...memoryStore.roznamcha];
  if (date) list = list.filter((r) => r.date === date);
  if (gariNo) list = list.filter((r) => r.gariNo === gariNo);

  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validated = RoznamchaSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: validated.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const res = await fetchFromCSharp("api/roznamcha", {
      method: "POST",
      body: JSON.stringify(validated.data),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: res.status });
    }
  } catch (err) {
    // Fallback to cloud memory store
  }

  const d = validated.data;
  const itemDate = d.date || new Date().toISOString().split("T")[0];
  const kiraya = Number(d.kiraya) || 0;
  const kharcha = Number(d.kharcha) || 0;
  const advance = Number(d.advance) || 0;
  const baqaya = kiraya - kharcha - advance;

  const newItem = {
    id: Date.now(),
    date: itemDate,
    displayDate: new Date(itemDate).toLocaleDateString("en-GB"),
    gariNo: d.gariNo,
    driverName: d.driverName,
    maal: d.maal || "",
    dieselLiter: Number(d.dieselLiter) || 0,
    kiraya,
    kharcha,
    advance,
    baqaya,
  };

  memoryStore.roznamcha.unshift(newItem);
  return NextResponse.json(newItem, { status: 201 });
}
