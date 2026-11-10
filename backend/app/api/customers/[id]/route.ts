import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { supabaseServer } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const res = await fetchFromCSharp(`api/oilshop/customers/${id}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    if (supabaseServer) {
      const { data, error } = await supabaseServer
        .from("customers")
        .select("*, sales_invoices(*)")
        .eq("id", id)
        .eq("is_deleted", false)
        .single();
      if (!error && data) return NextResponse.json(data);
    }
    return NextResponse.json({ error: "Customer not found or backend unreachable" }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const body = await req.json();
    const res = await fetchFromCSharp(`api/oilshop/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update customer", details: err.message }, { status: 502 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const res = await fetchFromCSharp(`api/oilshop/customers/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete customer", details: err.message }, { status: 502 });
  }
}
