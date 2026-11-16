export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTrialStatus, authState } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("mc_auth_token")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const result = verifyToken(token);
  if (!result.valid || !result.payload) {
    return NextResponse.json({ authenticated: false, user: null, error: result.error }, { status: 401 });
  }

  const { role, username, userId } = result.payload;

  // If Super Admin: permanent access
  if (role === "superadmin") {
    return NextResponse.json({
      authenticated: true,
      user: {
        id: userId,
        username,
        role: "superadmin",
        name: authState.superAdmin.name,
      },
      trialStatus: getTrialStatus(),
    });
  }

  // If Trial: verify trial expiration
  const trialStatus = getTrialStatus();
  if (trialStatus.isExpired || trialStatus.isDisabled) {
    return NextResponse.json(
      {
        authenticated: false,
        user: { id: userId, username, role: "trial" },
        error: "trial_expired",
        message: "Your 15-Day Free Trial Has Expired",
        trialStatus,
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: userId,
      username,
      role: "trial",
      name: "Trial Account",
    },
    trialStatus,
  });
}
