export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { supabaseServer } from "@/lib/supabase";
import { memoryStore, PurchaseInvoiceData } from "@/lib/memory-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const endpoint = search ? `api/oilshop/purchases?search=${encodeURIComponent(search)}` : "api/oilshop/purchases";

    const res = await fetchFromCSharp(endpoint);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    if (supabaseServer) {
      try {
        const { data, error } = await supabaseServer
          .from("purchase_invoices")
          .select("*, supplier:suppliers(*), lines:purchase_invoice_lines(*)")
          .eq("is_deleted", false)
          .order("date", { ascending: false });
        if (!error && data && data.length > 0) return NextResponse.json(data);
      } catch (e) {}
    }
  }

  return NextResponse.json(memoryStore.purchases);
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const res = await fetchFromCSharp("api/oilshop/purchases", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { status: 201 });
    }
  } catch (err) {}

  const newPurchase: PurchaseInvoiceData = {
    Id: Date.now(),
    InvoiceNumber: `PI-${Math.floor(100000 + Math.random() * 900000)}`,
    Date: body.Date || new Date().toISOString(),
    SupplierId: body.SupplierId,
    Supplier: { Name: body.SupplierName || "Supplier" },
    PaymentMode: body.PaymentMode || "Cash",
    SubTotal: Number(body.SubTotal || 0),
    Discount: Number(body.Discount || 0),
    Tax: Number(body.Tax || 0),
    GrandTotal: Number(body.GrandTotal || 0),
    PaidAmount: Number(body.PaidAmount || 0),
    Remarks: body.Remarks || "",
    Lines: body.Lines || [],
  };

  memoryStore.purchases.unshift(newPurchase);
  return NextResponse.json(newPurchase, { status: 201 });
}
