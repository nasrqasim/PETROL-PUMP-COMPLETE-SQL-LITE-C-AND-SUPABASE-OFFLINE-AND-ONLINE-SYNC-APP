export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { auditAndCleanDatabase } from "@/lib/accounting";
import { memoryStore, resetEntireDatabaseToZero } from "@/lib/memory-store";

function checkAuth(req: NextRequest) {
  const token = req.cookies.get("mc_auth_token")?.value;
  if (!token) return { ok: false, status: 401, error: "Authentication required" };
  const res = verifyToken(token);
  if (!res.valid) {
    return { ok: false, status: 403, error: "Invalid authentication token" };
  }
  return { ok: true, payload: res.payload };
}

// GET: Return current database audit diagnostics
export async function GET(req: NextRequest) {
  const auth = checkAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const customersDiscrepancy: any[] = [];
  memoryStore.customers.forEach((c) => {
    const ledgers = memoryStore.customerLedgers.filter((l) => Number(l.CustomerId) === Number(c.Id));
    let net = 0;
    ledgers.forEach((l) => (net += (Number(l.Debit) || 0) - (Number(l.Credit) || 0)));
    const expectedDue = net > 0 ? net : 0;
    const expectedAdv = net < 0 ? Math.abs(net) : 0;
    if (c.BalanceDue !== expectedDue || c.Advance !== expectedAdv) {
      customersDiscrepancy.push({
        id: c.Id,
        name: c.Name,
        currentDue: c.BalanceDue,
        expectedDue,
        currentAdvance: c.Advance,
        expectedAdv,
      });
    }
  });

  const suppliersDiscrepancy: any[] = [];
  memoryStore.suppliers.forEach((s) => {
    const ledgers = memoryStore.supplierLedgers.filter((l) => Number(l.SupplierId) === Number(s.Id));
    let net = 0;
    ledgers.forEach((l) => (net += (Number(l.Credit) || 0) - (Number(l.Debit) || 0)));
    const expectedDue = net > 0 ? net : 0;
    const expectedAdv = net < 0 ? Math.abs(net) : 0;
    if (s.BalanceDue !== expectedDue || s.Advance !== expectedAdv) {
      suppliersDiscrepancy.push({
        id: s.Id,
        name: s.Name,
        currentDue: s.BalanceDue,
        expectedDue,
        currentAdvance: s.Advance,
        expectedAdv,
      });
    }
  });

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    counts: {
      customers: memoryStore.customers.length,
      suppliers: memoryStore.suppliers.length,
      roznamcha: memoryStore.roznamcha.length,
      vouchers: memoryStore.vouchers.length,
      products: memoryStore.products.length,
      staff: memoryStore.staff.length,
      vehicles: memoryStore.gariyan.length,
      bankAccounts: memoryStore.bankAccounts.length,
      cashTransactions: memoryStore.cashTransactions.length,
      bankTransactions: memoryStore.bankTransactions.length,
      auditLogs: memoryStore.auditLogs?.length || 0,
    },
    discrepancies: {
      customers: customersDiscrepancy,
      suppliers: suppliersDiscrepancy,
      totalIssues: customersDiscrepancy.length + suppliersDiscrepancy.length,
    },
    isHealthy: customersDiscrepancy.length === 0 && suppliersDiscrepancy.length === 0,
  });
}

// POST: Execute the database audit & cleanup or full zero reset
export async function POST(req: NextRequest) {
  const auth = checkAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const url = new URL(req.url);
  const action = body.action || url.searchParams.get("action") || "reconcile";

  if (action === "reset_zero") {
    resetEntireDatabaseToZero();
    return NextResponse.json({
      success: true,
      action: "reset_zero",
      message: "Database completely cleaned and reset to zero.",
      timestamp: new Date().toISOString(),
      counts: {
        customers: 0,
        suppliers: 0,
        roznamcha: 0,
        vouchers: 0,
        products: 0,
        staff: 0,
        vehicles: 0,
      },
    });
  }

  const result = auditAndCleanDatabase();
  return NextResponse.json(result);
}
