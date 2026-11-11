import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { supabaseServer } from "@/lib/supabase";
import { memoryStore, SupplierData } from "@/lib/memory-store";

export async function GET() {
  try {
    const res = await fetchFromCSharp("api/oilshop/suppliers");
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    if (supabaseServer) {
      try {
        const { data, error } = await supabaseServer
          .from("suppliers")
          .select("*")
          .eq("is_deleted", false)
          .order("name");
        if (!error && data && data.length > 0) return NextResponse.json(data);
      } catch (e) {}
    }
  }

  return NextResponse.json(memoryStore.suppliers);
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const res = await fetchFromCSharp("api/oilshop/suppliers", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { status: 201 });
    }
  } catch (err) {
    if (supabaseServer) {
      try {
        const { data, error } = await supabaseServer
          .from("suppliers")
          .insert([body])
          .select()
          .single();
        if (!error && data) return NextResponse.json(data, { status: 201 });
      } catch (e) {}
    }
  }

  const newSupplier: SupplierData = {
    Id: Date.now(),
    Name: body.Name || body.name || "New Supplier",
    Phone: body.Phone || body.phone || "",
    Address: body.Address || body.address || "",
    Email: body.Email || body.email || "",
    NTN: body.NTN || body.ntn || "",
    BalanceDue: Number(body.BalanceDue || body.balanceDue || 0),
    Advance: Number(body.Advance || body.advance || 0),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  };

  memoryStore.suppliers.unshift(newSupplier);
  return NextResponse.json(newSupplier, { status: 201 });
}
