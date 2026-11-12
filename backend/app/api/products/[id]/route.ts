import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { memoryStore } from "@/lib/memory-store";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  try {
    await fetchFromCSharp(`api/oilshop/products/${id}`, { method: "DELETE" }).catch(() => {});
  } catch (e) {}

  memoryStore.products = memoryStore.products.filter((p) => p.Id !== id);
  return NextResponse.json({ success: true });
}
