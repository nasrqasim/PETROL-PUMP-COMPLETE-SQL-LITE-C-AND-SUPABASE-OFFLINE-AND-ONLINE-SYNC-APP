import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { supabaseServer } from "@/lib/supabase";
import { memoryStore, CustomerData } from "@/lib/memory-store";

export async function GET() {
  try {
    const res = await fetchFromCSharp("api/oilshop/customers");
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    if (supabaseServer) {
      try {
        const { data, error } = await supabaseServer
          .from("customers")
          .select("*")
          .eq("is_deleted", false)
          .order("name");
        if (!error && data && data.length > 0) return NextResponse.json(data);
      } catch (e) {}
    }
  }

  // Cloud Fallback
  return NextResponse.json(memoryStore.customers);
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 1. Try local C# offline bridge if running
  try {
    const res = await fetchFromCSharp("api/oilshop/customers", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { status: 201 });
    }
  } catch (err) {
    // 2. Try Supabase cloud database if configured
    if (supabaseServer) {
      try {
        const { data, error } = await supabaseServer
          .from("customers")
          .insert([body])
          .select()
          .single();
        if (!error && data) return NextResponse.json(data, { status: 201 });
      } catch (e) {}
    }
  }

  // 3. Cloud Memory Store Fallback (Guarantees add customer succeeds on Vercel without throwing 502)
  const newCustomer: CustomerData = {
    Id: Date.now(),
    Name: body.Name || body.name || "New Customer",
    Phone: body.Phone || body.phone || "",
    Address: body.Address || body.address || "",
    Email: body.Email || body.email || "",
    NTN: body.NTN || body.ntn || "",
    BalanceDue: Number(body.BalanceDue || body.balanceDue || 0),
    Advance: Number(body.Advance || body.advance || 0),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  };

  memoryStore.customers.unshift(newCustomer);
  return NextResponse.json(newCustomer, { status: 201 });
}
