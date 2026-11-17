export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { memoryStore } from "@/lib/memory-store";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const account = memoryStore.bankAccounts.find((b) => b.Id === id);
  if (!account) return NextResponse.json({ error: "Bank account not found" }, { status: 404 });

  // Fetch transactions for this bank account
  const transactions = memoryStore.bankTransactions.filter((t) => t.BankAccountId === id);
  return NextResponse.json({ ...account, transactions });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const idx = memoryStore.bankAccounts.findIndex((b) => b.Id === id);
  if (idx === -1) return NextResponse.json({ error: "Bank account not found" }, { status: 404 });

  const existing = memoryStore.bankAccounts[idx];
  const updated = {
    ...existing,
    BankName: body.BankName?.trim() || existing.BankName,
    AccountTitle: body.AccountTitle?.trim() || existing.AccountTitle,
    AccountNumber: body.AccountNumber?.trim() || existing.AccountNumber,
    BranchName: body.BranchName !== undefined ? body.BranchName.trim() : existing.BranchName,
    Status: body.Status === "Inactive" ? ("Inactive" as const) : ("Active" as const),
    Description: body.Description !== undefined ? body.Description.trim() : existing.Description,
  };

  memoryStore.bankAccounts[idx] = updated;
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const idx = memoryStore.bankAccounts.findIndex((b) => b.Id === id);
  if (idx === -1) return NextResponse.json({ error: "Bank account not found" }, { status: 404 });

  // Rule: Do not permanently delete a bank account if it already has transactions
  const hasTx = memoryStore.bankTransactions.some((t) => t.BankAccountId === id);
  if (hasTx) {
    // Soft disable/deactivate instead
    memoryStore.bankAccounts[idx].Status = "Inactive";
    return NextResponse.json({
      message: "Bank account has transactions; status deactivated to Inactive.",
      account: memoryStore.bankAccounts[idx],
    });
  }

  memoryStore.bankAccounts.splice(idx, 1);
  return NextResponse.json({ message: "Bank account deleted successfully" });
}
