export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { memoryStore } from "@/lib/memory-store";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = await req.json();

  try {
    const res = await fetchFromCSharp(`api/oilshop/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    if (res && res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data);
    }
  } catch (e) {}

  const idx = memoryStore.products.findIndex((p) => p.Id === id);
  if (idx !== -1) {
    memoryStore.products[idx] = {
      ...memoryStore.products[idx],
      ...body,
      Id: id,
      UpdatedAt: new Date().toISOString(),
    };
    return NextResponse.json(memoryStore.products[idx]);
  }

  return NextResponse.json({ success: true, ...body, Id: id });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  try {
    await fetchFromCSharp(`api/oilshop/products/${id}`, { method: "DELETE" }).catch(() => {});
  } catch (e) {}

  memoryStore.products = memoryStore.products.filter((p) => p.Id !== id);
  return NextResponse.json({ success: true });
}
