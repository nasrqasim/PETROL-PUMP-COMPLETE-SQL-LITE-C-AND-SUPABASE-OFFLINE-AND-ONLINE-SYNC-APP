export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { memoryStore } from "@/lib/memory-store";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  memoryStore.purchases = memoryStore.purchases.filter((p) => p.Id !== id);
  return NextResponse.json({ success: true });
}
