import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { supabaseServer } from "@/lib/supabase";
import { memoryStore, ProductData } from "@/lib/memory-store";

export async function GET() {
  try {
    const res = await fetchFromCSharp("api/oilshop/products");
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    if (supabaseServer) {
      try {
        const { data, error } = await supabaseServer
          .from("products")
          .select("*")
          .eq("is_deleted", false)
          .order("name");
        if (!error && data && data.length > 0) return NextResponse.json(data);
      } catch (e) {}
    }
  }

  return NextResponse.json(memoryStore.products);
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const res = await fetchFromCSharp("api/oilshop/products", {
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
          .from("products")
          .insert([body])
          .select()
          .single();
        if (!error && data) return NextResponse.json(data, { status: 201 });
      } catch (e) {}
    }
  }

  const newProduct: ProductData = {
    Id: Date.now(),
    Name: body.Name || body.name || "New Product",
    Category: body.Category || body.category || "General",
    Unit: body.Unit || body.unit || "Liters",
    SalePrice: Number(body.SalePrice || body.salePrice || 0),
    PurchasePrice: Number(body.PurchasePrice || body.purchasePrice || 0),
    StockQuantity: Number(body.StockQuantity || body.stockQuantity || 0),
    LowStockAlert: Number(body.LowStockAlert || body.lowStockAlert || 10),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  };

  memoryStore.products.unshift(newProduct);
  return NextResponse.json(newProduct, { status: 201 });
}
