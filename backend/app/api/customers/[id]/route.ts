export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { memoryStore } from "@/lib/memory-store";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  try {
    await fetchFromCSharp(`api/oilshop/customers/${id}`, { method: "DELETE" }).catch(() => {});
  } catch (e) {}

  memoryStore.customers = memoryStore.customers.filter((c) => c.Id !== id);
  return NextResponse.json({ success: true });
}
