export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { RoznamchaSchema } from "@/lib/validations";
import { memoryStore, persistStore } from "@/lib/memory-store";
import {
  postCustomerTripCharge,
  postCustomerPayment,
  applyCustomerAdvance,
  postCashTransaction,
  syncVehicleTrackingFromRoznamcha,
} from "@/lib/accounting";

// Cache for duplicate submission prevention (stores recent hash within 5 seconds)
const recentSubmissions = new Map<string, number>();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const endpoint = queryString ? `api/roznamcha?${queryString}` : "api/roznamcha";

    const res = await fetchFromCSharp(endpoint);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    // Fallback to cloud memory store
  }

  // High-Performance Query with Filtering, Date Range & Pagination
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const gariNo = searchParams.get("gariNo");
  const driverName = searchParams.get("driverName");
  const q = searchParams.get("q") || searchParams.get("search");
  const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : null;
  const limit = searchParams.get("limit") ? Math.min(parseInt(searchParams.get("limit")!, 10), 500) : 100;

  let list = memoryStore.roznamcha;

  // Optimized Filtering
  if (date) {
    list = list.filter((r) => r.date === date);
  } else if (startDate || endDate) {
    list = list.filter((r) => {
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;
      return true;
    });
  }

  if (gariNo) {
    const gUpper = gariNo.trim().toUpperCase();
    list = list.filter((r) => r.gariNo.toUpperCase() === gUpper);
  }

  if (driverName) {
    const dLower = driverName.trim().toLowerCase();
    list = list.filter((r) => r.driverName.toLowerCase().includes(dLower));
  }

  if (q) {
    const query = q.trim().toLowerCase();
    list = list.filter(
      (r) =>
        r.gariNo.toLowerCase().includes(query) ||
        r.driverName.toLowerCase().includes(query) ||
        (r.maal && r.maal.toLowerCase().includes(query)) ||
        (r.otherExpenseName && r.otherExpenseName.toLowerCase().includes(query))
    );
  }

  // If client requested server-side pagination
  if (page !== null && page > 0) {
    const total = list.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedRecords = list.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      records: paginatedRecords,
      total,
      page,
      limit,
      totalPages,
    });
  }

  // Return standard array (limit to max 500 items for memory safety in browser)
  if (list.length > 500) {
    return NextResponse.json(list.slice(0, 500));
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

  const validated = RoznamchaSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: validated.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const d = validated.data;

  // Duplicate Submission Prevention (5-second window on identical payload)
  const submissionKey = `${d.date}_${d.gariNo}_${d.driverName}_${d.kiraya}_${d.advance}`;
  const now = Date.now();
  const lastTime = recentSubmissions.get(submissionKey);
  if (lastTime && now - lastTime < 5000) {
    return NextResponse.json(
      { error: "Duplicate entry detected. Please wait 5 seconds before submitting identical entry." },
      { status: 409 }
    );
  }
  recentSubmissions.set(submissionKey, now);

  try {
    const res = await fetchFromCSharp("api/roznamcha", {
      method: "POST",
      body: JSON.stringify(validated.data),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: res.status });
    }
  } catch (err) {
    // Fallback to cloud memory store
  }

  const itemDate = d.date || new Date().toISOString().split("T")[0];
  const kiraya = Number(d.kiraya) || 0;
  const kharcha = Number(d.kharcha) || 0;
  const otherExpenseAmount = Number(d.otherExpenseAmount) || 0;
  const unitQuantity = Number(d.unitQuantity) || 0;
  const pricePerUnit = Number(d.pricePerUnit) || 0;
  const materialAmount = unitQuantity > 0 && pricePerUnit > 0 ? unitQuantity * pricePerUnit : 0;
  const advance = Number(d.advance) || 0;

  // Expenses add to total and only advance decreases it
  const totalGross = kiraya + kharcha + otherExpenseAmount + materialAmount;
  const baqaya = totalGross - advance;

  const newItem = {
    id: Date.now(),
    date: itemDate,
    displayDate: new Date(itemDate).toLocaleDateString("en-GB"),
    gariNo: d.gariNo,
    driverName: d.driverName,
    maal: d.maal || "",
    unit: d.unit || "",
    unitQuantity,
    pricePerUnit,
    materialAmount,
    dieselLiter: Number(d.dieselLiter) || 0,
    kiraya,
    kharcha,
    otherExpenseName: d.otherExpenseName || "",
    otherExpenseAmount,
    advance,
    baqaya,

    // Customer, Location & Payment
    customerId: d.customerId,
    customerName: d.customerName || (d.customerId ? memoryStore.customers.find((c) => c.Id === d.customerId)?.Name : ""),
    fromLocation: d.fromLocation || "",
    toLocation: d.toLocation || "",
    deliveryAddress: d.deliveryAddress || "",
    paymentStatus: d.paymentStatus || "Credit / Pay Later",
    paymentMethod: d.paymentMethod || "Cash",
    bankAccountId: d.bankAccountId,
    paidAmount: Number(d.paidAmount) || 0,
    advanceUsed: Number(d.advanceUsed) || 0,
  };

  memoryStore.roznamcha.unshift(newItem);

  // Accounting Integration: Post to Customer Ledger & Cash/Bank
  if (d.customerId) {
    postCustomerTripCharge({
      customerId: d.customerId,
      date: itemDate,
      tripRef: String(newItem.id),
      description: `Trip #${newItem.id} - ${d.gariNo} (${d.maal || "Cargo"}) ${d.fromLocation ? `${d.fromLocation} → ` : ""}${d.toLocation || "Site"}`,
      chargeAmount: kiraya,
    });

    if (d.paymentStatus === "Fully Paid") {
      postCustomerPayment({
        customerId: d.customerId,
        date: itemDate,
        voucherNumber: `REC-${newItem.id}`,
        paymentAmount: kiraya,
        paymentMethod: (d.paymentMethod === "Bank" ? "Bank" : "Cash") as "Cash" | "Bank",
        bankAccountId: d.bankAccountId,
        description: `Full payment received for Trip #${newItem.id}`,
        tripRef: String(newItem.id),
      });
    } else if (d.paymentStatus === "Partially Paid" && Number(d.paidAmount) > 0) {
      postCustomerPayment({
        customerId: d.customerId,
        date: itemDate,
        voucherNumber: `PART-REC-${newItem.id}`,
        paymentAmount: Number(d.paidAmount),
        paymentMethod: (d.paymentMethod === "Bank" ? "Bank" : "Cash") as "Cash" | "Bank",
        bankAccountId: d.bankAccountId,
        description: `Partial payment received for Trip #${newItem.id}`,
        tripRef: String(newItem.id),
      });
    } else if (d.paymentStatus === "Use Existing Customer Advance" || d.paymentStatus === "Advance Adjustment") {
      const applyAmt = Number(d.advanceUsed) || Number(d.paidAmount) || kiraya;
      applyCustomerAdvance({
        customerId: d.customerId,
        date: itemDate,
        tripRef: String(newItem.id),
        appliedAmount: applyAmt,
      });
    }
  }

  // Automatic Vehicle Tracking Sync
  try {
    syncVehicleTrackingFromRoznamcha(newItem);
  } catch (trackErr) {
    console.error("Vehicle tracking sync warning:", trackErr);
  }

  persistStore();

  return NextResponse.json(newItem, { status: 201 });
}
