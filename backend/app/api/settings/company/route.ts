export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { memoryStore } from "@/lib/memory-store";
import { persistStore } from "@/lib/memory-store";
import { addAuditLog } from "@/lib/accounting";

export async function GET() {
  return NextResponse.json(memoryStore.companySettings);
}

export async function PUT(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const existing = memoryStore.companySettings;

  const updated = {
    companyName: body.companyName?.trim() || existing.companyName,
    tagline: body.tagline?.trim() || existing.tagline,
    address: body.address?.trim() || existing.address,
    phone: body.phone?.trim() || existing.phone,
    email: body.email !== undefined ? body.email.trim() : existing.email,
    description: body.description !== undefined ? body.description.trim() : existing.description,
    logoUrl: body.logoUrl || existing.logoUrl,
    // Permanent non-editable credit strictly locked
    permanentCredit: "Software By Roonjha Developers : 03152914836",
    developerAttribution: "Software By Roonjha Developers : 03152914836",
    updatedAt: new Date().toISOString(),
  };

  const oldValues = `Name: ${existing.companyName}, Phone: ${existing.phone}, Address: ${existing.address}`;
  const newValues = `Name: ${updated.companyName}, Phone: ${updated.phone}, Address: ${updated.address}`;

  memoryStore.companySettings = updated;

  // Persist to disk immediately so settings survive cold starts
  persistStore();

  addAuditLog({
    action: "BRANDING_UPDATE",
    module: "Company Profile",
    details: `Company profile updated: ${updated.companyName}`,
    oldValue: oldValues,
    newValue: newValues,
  });

  return NextResponse.json(updated);
}
