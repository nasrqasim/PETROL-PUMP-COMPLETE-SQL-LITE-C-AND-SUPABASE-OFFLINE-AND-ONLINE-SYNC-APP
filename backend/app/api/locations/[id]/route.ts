export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { memoryStore } from "@/lib/memory-store";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const loc = memoryStore.locations.find((l) => l.id === id);
  if (!loc) return NextResponse.json({ error: "Location not found" }, { status: 404 });
  return NextResponse.json(loc);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const idx = memoryStore.locations.findIndex((l) => l.id === id);
  if (idx === -1) return NextResponse.json({ error: "Location not found" }, { status: 404 });

  const existing = memoryStore.locations[idx];
  const updated = {
    ...existing,
    name: body.name?.trim() || existing.name,
    city: body.city?.trim() || existing.city,
    type: body.type?.trim() || existing.type,
    address: body.address !== undefined ? body.address.trim() : existing.address,
    status: body.status === "Inactive" ? ("Inactive" as const) : ("Active" as const),
  };

  memoryStore.locations[idx] = updated;
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const idx = memoryStore.locations.findIndex((l) => l.id === id);
  if (idx === -1) return NextResponse.json({ error: "Location not found" }, { status: 404 });

  memoryStore.locations.splice(idx, 1);
  return NextResponse.json({ message: "Location deleted successfully" });
}
