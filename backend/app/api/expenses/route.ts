import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { supabaseServer } from "@/lib/supabase";
import { memoryStore, ExpenseData } from "@/lib/memory-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const endpoint = search ? `api/oilshop/expenses?search=${encodeURIComponent(search)}` : "api/oilshop/expenses";

    const res = await fetchFromCSharp(endpoint);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    if (supabaseServer) {
      try {
        const { data, error } = await supabaseServer
          .from("expenses")
          .select("*")
          .eq("is_deleted", false)
          .order("date", { ascending: false });
        if (!error && data && data.length > 0) return NextResponse.json(data);
      } catch (e) {}
    }
  }

  return NextResponse.json(memoryStore.expenses);
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const res = await fetchFromCSharp("api/oilshop/expenses", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { status: 201 });
    }
  } catch (err) {}

  const newExpense: ExpenseData = {
    Id: Date.now(),
    Date: body.Date || new Date().toISOString(),
    Category: body.Category || "Miscellaneous",
    PaymentMode: body.PaymentMode || "Cash",
    Amount: Number(body.Amount || 0),
    Remarks: body.Remarks || "",
  };

  memoryStore.expenses.unshift(newExpense);
  return NextResponse.json(newExpense, { status: 201 });
}
