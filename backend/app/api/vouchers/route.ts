export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { memoryStore } from "@/lib/memory-store";
import { processVoucher } from "@/lib/accounting";

export async function GET(req: NextRequest) {
  try {
    const res = await fetchFromCSharp("api/oilshop/vouchers");
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    // Fallback to memory store
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const date = searchParams.get("date");
  const partyType = searchParams.get("partyType");

  let list = [...memoryStore.vouchers];
  if (type) list = list.filter((v) => v.PaymentType === type);
  if (date) list = list.filter((v) => v.Date === date);
  if (partyType) list = list.filter((v) => v.PartyType === partyType);

  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON request" }, { status: 400 });
  }

  const paymentType = body.PaymentType || body.VoucherType;
  if (!paymentType) {
    return NextResponse.json({ error: "Voucher / Payment type is required" }, { status: 400 });
  }

  const amount = Number(body.Amount) || 0;
  if (amount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
  }

  try {
    const res = await fetchFromCSharp("api/oilshop/vouchers", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: 201 });
    }
  } catch (err) {
    // Fallback to unified accounting engine
  }

  const date = body.Date || new Date().toISOString().split("T")[0];
  const partyType = body.PartyType || "General";

  // Use unified accounting processor to post voucher and update cash/bank/ledgers
  const voucher = processVoucher({
    VoucherNumber: body.VoucherNumber,
    Date: date,
    PaymentType: paymentType,
    PartyType: partyType,
    CustomerId: body.CustomerId ? Number(body.CustomerId) : undefined,
    SupplierId: body.SupplierId ? Number(body.SupplierId) : undefined,
    StaffId: body.StaffId ? Number(body.StaffId) : undefined,
    BankAccountId: body.BankAccountId ? Number(body.BankAccountId) : undefined,
    GariNo: body.GariNo,
    DriverName: body.DriverName,
    Amount: amount,
    Remarks: body.Remarks,
  });

  return NextResponse.json(voucher, { status: 201 });
}
