export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { memoryStore } from "@/lib/memory-store";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  try {
    const res = await fetchFromCSharp(`api/oilshop/vouchers/${id}`);
    if (res.ok) return NextResponse.json(await res.json());
  } catch (err) {}

  const voucher = memoryStore.vouchers.find((v) => v.Id === id);
  if (!voucher) return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
  return NextResponse.json(voucher);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const res = await fetchFromCSharp(`api/oilshop/vouchers/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (res.ok) return NextResponse.json(await res.json());
  } catch (err) {}

  const idx = memoryStore.vouchers.findIndex((v) => v.Id === id);
  if (idx === -1) return NextResponse.json({ error: "Voucher not found" }, { status: 404 });

  const existing = memoryStore.vouchers[idx];
  const updated = {
    ...existing,
    PaymentType: body.PaymentType || body.VoucherType || existing.PaymentType,
    PartyType: body.PartyType || existing.PartyType,
    Amount: body.Amount !== undefined ? Number(body.Amount) : existing.Amount,
    Remarks: body.Remarks !== undefined ? body.Remarks : existing.Remarks,
    GariNo: body.GariNo !== undefined ? body.GariNo : existing.GariNo,
    DriverName: body.DriverName !== undefined ? body.DriverName : existing.DriverName,
  };

  memoryStore.vouchers[idx] = updated;
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  try {
    const res = await fetchFromCSharp(`api/oilshop/vouchers/${id}`, { method: "DELETE" });
    if (res.ok) return NextResponse.json({ message: "Voucher deleted successfully" });
  } catch (err) {}

  const idx = memoryStore.vouchers.findIndex((v) => v.Id === id);
  if (idx === -1) return NextResponse.json({ error: "Voucher not found" }, { status: 404 });

  memoryStore.vouchers.splice(idx, 1);
  return NextResponse.json({ message: "Voucher deleted successfully" });
}
