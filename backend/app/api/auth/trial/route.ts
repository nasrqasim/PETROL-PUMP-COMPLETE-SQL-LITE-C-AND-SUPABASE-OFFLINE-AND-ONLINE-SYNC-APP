export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  verifyToken,
  getTrialStatus,
  activateTrial,
  disableTrial,
  enableTrial,
  updateTrialCredentials,
} from "@/lib/auth";

// Super Admin Auth Check Helper
function requireSuperAdmin(req: NextRequest) {
  const token = req.cookies.get("mc_auth_token")?.value;
  if (!token) return { ok: false, status: 401, error: "Authentication required" };
  const res = verifyToken(token);
  if (!res.valid || res.payload?.role !== "superadmin") {
    return { ok: false, status: 403, error: "Super Admin privileges required" };
  }
  return { ok: true, payload: res.payload };
}

// GET: View Trial Status (Super Admin Only)
export async function GET(req: NextRequest) {
  const check = requireSuperAdmin(req);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const status = getTrialStatus();
  return NextResponse.json(status);
}

// POST: Manage Trial (Activate, Disable, Enable, Update Credentials)
export async function POST(req: NextRequest) {
  const check = requireSuperAdmin(req);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON request" }, { status: 400 });
  }

  const { action, days, newUsername, newPassword } = body;

  switch (action) {
    case "activate":
      activateTrial(Number(days) || 15);
      break;

    case "disable":
      disableTrial();
      break;

    case "enable":
      enableTrial();
      break;

    case "update_credentials":
      updateTrialCredentials(newUsername, newPassword);
      break;

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  const updatedStatus = getTrialStatus();
  return NextResponse.json({
    success: true,
    message: `Trial action '${action}' completed successfully`,
    status: updatedStatus,
  });
}
