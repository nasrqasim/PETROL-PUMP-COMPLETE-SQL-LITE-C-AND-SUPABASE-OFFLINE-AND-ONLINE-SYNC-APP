import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const body = await req.json();
    const res = await fetchFromCSharp(`api/oilshop/staff/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update staff", details: err.message }, { status: 502 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const res = await fetchFromCSharp(`api/oilshop/staff/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete staff", details: err.message }, { status: 502 });
  }
}
