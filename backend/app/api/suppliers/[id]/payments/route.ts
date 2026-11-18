export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { memoryStore } from "@/lib/memory-store";
import { postSupplierPayment } from "@/lib/accounting";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const suppId = Number(params.id);
  const supplier = memoryStore.suppliers.find((s) => Number(s.Id) === suppId);

  if (!supplier) {
    return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Payment amount must be greater than zero" }, { status: 400 });
  }

  const paymentMethod: "Cash" | "Bank" = body.paymentMethod === "Bank" ? "Bank" : "Cash";
  const bankAccountId = paymentMethod === "Bank" && body.bankAccountId ? Number(body.bankAccountId) : undefined;

  if (paymentMethod === "Bank" && !bankAccountId) {
    return NextResponse.json({ error: "Please select a valid bank account to disburse funds from" }, { status: 400 });
  }

  const date = body.date || new Date().toISOString().split("T")[0];
  const voucherNumber =
    body.voucherNumber?.trim() ||
    `CP-${date.replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`;

  const result = postSupplierPayment({
    supplierId: suppId,
    date,
    voucherNumber,
    paymentAmount: amount,
    paymentMethod,
    bankAccountId,
    description: body.narration || body.description || `Payment disbursed to ${supplier.Name}`,
  });

  return NextResponse.json({
    success: true,
    supplier: {
      id: supplier.Id,
      name: supplier.Name,
      balanceDue: supplier.BalanceDue,
      advance: supplier.Advance,
      netPayable: supplier.BalanceDue - supplier.Advance,
    },
    voucher: result.voucher,
    ledgerEntry: result.ledgerEntry,
    cashEntry: result.cashEntry,
    bankEntry: result.bankEntry,
  }, { status: 201 });
}
