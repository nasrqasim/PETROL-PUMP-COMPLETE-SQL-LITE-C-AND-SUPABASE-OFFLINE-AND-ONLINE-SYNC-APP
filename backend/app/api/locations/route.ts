export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { memoryStore, LocationData } from "@/lib/memory-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let list = [...memoryStore.locations];
  if (status) {
    list = list.filter((l) => l.status.toLowerCase() === status.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.type.toLowerCase().includes(q)
    );
  }

  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Location name is required" }, { status: 400 });
  }

  const newLoc: LocationData = {
    id: Date.now(),
    name: body.name.trim(),
    city: body.city?.trim() || "Hub / Lasbela",
    type: body.type?.trim() || "Construction Site",
    address: body.address?.trim() || "",
    status: body.status === "Inactive" ? "Inactive" : "Active",
  };

  memoryStore.locations.unshift(newLoc);
  return NextResponse.json(newLoc, { status: 201 });
}
