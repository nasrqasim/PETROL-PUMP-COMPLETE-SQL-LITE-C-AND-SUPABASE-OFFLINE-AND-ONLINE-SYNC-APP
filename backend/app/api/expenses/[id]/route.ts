import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const res = await fetchFromCSharp(`api/oilshop/expenses/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete expense", details: err.message }, { status: 502 });
  }
}
