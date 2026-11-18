export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { memoryStore } from "@/lib/memory-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const moduleName = searchParams.get("module");
  const action = searchParams.get("action");
  const search = searchParams.get("search");

  let list = [...(memoryStore.auditLogs || [])];

  if (moduleName && moduleName !== "all") {
    list = list.filter((l) => l.module.toLowerCase() === moduleName.toLowerCase());
  }
  if (action && action !== "all") {
    list = list.filter((l) => l.action.toLowerCase() === action.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (l) =>
        l.details.toLowerCase().includes(q) ||
        l.module.toLowerCase().includes(q) ||
        l.username.toLowerCase().includes(q) ||
        (l.reference && l.reference.toLowerCase().includes(q))
    );
  }

  return NextResponse.json({
    totalCount: list.length,
    logs: list,
  });
}
