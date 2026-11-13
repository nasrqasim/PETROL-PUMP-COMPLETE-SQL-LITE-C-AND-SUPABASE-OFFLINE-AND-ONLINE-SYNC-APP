export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { memoryStore } from "@/lib/memory-store";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  try {
    await fetchFromCSharp(`api/oilshop/expenses/${id}`, { method: "DELETE" }).catch(() => {});
  } catch (e) {}

  memoryStore.expenses = memoryStore.expenses.filter((e) => e.Id !== id);
  return NextResponse.json({ success: true });
}
