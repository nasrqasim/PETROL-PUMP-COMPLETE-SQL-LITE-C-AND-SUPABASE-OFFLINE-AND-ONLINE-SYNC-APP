export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { memoryStore } from "@/lib/memory-store";
import { postCustomerPayment, postCustomerDisbursement } from "@/lib/accounting";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const custId = Number(params.id);
  const customer = memoryStore.customers.find((c) => Number(c.Id) === custId);

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
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
    return NextResponse.json({ error: "Please select a valid receiving bank account" }, { status: 400 });
  }

  const date = body.date || new Date().toISOString().split("T")[0];
  const isOutflow =
    body.isOutflow === true ||
    body.type === "paymentOut" ||
    body.type === "disbursement" ||
    body.paymentType === "PaymentOut" ||
    body.paymentType === "CashPayment" ||
    body.paymentType === "BankPayment";

  const voucherNumber =
    body.voucherNumber?.trim() ||
    `${isOutflow ? (paymentMethod === "Cash" ? "CP" : "BP") : (paymentMethod === "Cash" ? "CR" : "BR")}-${date.replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`;

  let result: any;
  if (isOutflow) {
    result = postCustomerDisbursement({
      customerId: custId,
      date,
      voucherNumber,
      amount,
      paymentMethod,
      bankAccountId,
      description: body.narration || body.description || `Payment disbursed to customer ${customer.Name}`,
    });
  } else {
    result = postCustomerPayment({
      customerId: custId,
      date,
      voucherNumber,
      paymentAmount: amount,
      paymentMethod,
      bankAccountId,
      description: body.narration || body.description || `Payment received from ${customer.Name}`,
      tripRef: body.referenceNumber || body.tripRef,
    });
  }

  return NextResponse.json({
    success: true,
    customer: {
      id: customer.Id,
      name: customer.Name,
      balanceDue: customer.BalanceDue,
      advance: customer.Advance,
      netBalance: customer.BalanceDue - customer.Advance,
    },
    voucher: result.voucher,
    ledgerEntry: result.ledgerEntry,
    cashEntry: result.cashEntry,
    bankEntry: result.bankEntry,
  }, { status: 201 });
}
