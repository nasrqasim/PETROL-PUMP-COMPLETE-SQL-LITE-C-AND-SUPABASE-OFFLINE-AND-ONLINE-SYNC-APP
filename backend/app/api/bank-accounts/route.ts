export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { memoryStore, BankAccountData } from "@/lib/memory-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let list = [...memoryStore.bankAccounts];
  if (status) {
    list = list.filter((b) => b.Status.toLowerCase() === status.toLowerCase());
  }
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.BankName?.trim()) {
    return NextResponse.json({ error: "Bank name is required" }, { status: 400 });
  }
  if (!body.AccountTitle?.trim()) {
    return NextResponse.json({ error: "Account title is required" }, { status: 400 });
  }
  if (!body.AccountNumber?.trim()) {
    return NextResponse.json({ error: "Account number is required" }, { status: 400 });
  }

  const opening = Number(body.OpeningBalance) || 0;
  const newAccount: BankAccountData = {
    Id: Date.now(),
    BankName: body.BankName.trim(),
    AccountTitle: body.AccountTitle.trim(),
    AccountNumber: body.AccountNumber.trim(),
    BranchName: body.BranchName?.trim() || "",
    OpeningBalance: opening,
    CurrentBalance: opening,
    Status: body.Status === "Inactive" ? "Inactive" : "Active",
    Description: body.Description?.trim() || "",
  };

  memoryStore.bankAccounts.push(newAccount);

  // Record opening balance transaction if > 0
  if (opening > 0) {
    memoryStore.bankTransactions.push({
      Id: Date.now() + 1,
      BankAccountId: newAccount.Id,
      Date: new Date().toISOString().split("T")[0],
      VoucherNumber: `OP-BANK-${newAccount.Id}`,
      Description: `Opening Balance for ${newAccount.BankName}`,
      TransactionType: "Opening Balance",
      BankIn: opening,
      BankOut: 0,
      RunningBalance: opening,
    });
  }

  return NextResponse.json(newAccount, { status: 201 });
}
