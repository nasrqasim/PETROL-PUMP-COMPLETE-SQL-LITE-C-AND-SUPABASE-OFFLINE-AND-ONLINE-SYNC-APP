import { NextRequest, NextResponse } from "next/server";
import { memoryStore } from "@/lib/memory-store";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  memoryStore.sales = memoryStore.sales.filter((s) => s.Id !== id);
  return NextResponse.json({ success: true });
}
