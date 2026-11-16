export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  authState,
  verifyPassword,
  signToken,
  getTrialStatus,
} from "@/lib/auth";

// In-Memory IP Rate Limiter: max 10 failed login attempts per 15 minutes
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remainingSec: number } {
  const record = loginAttempts.get(ip);
  const now = Date.now();
  if (record && record.lockedUntil > now) {
    return { allowed: false, remainingSec: Math.ceil((record.lockedUntil - now) / 1000) };
  }
  if (record && record.lockedUntil <= now) {
    loginAttempts.delete(ip);
  }
  return { allowed: true, remainingSec: 0 };
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= 10) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15 mins lock
  }
  loginAttempts.set(ip, record);
}

function recordSuccessfulAttempt(ip: string): void {
  loginAttempts.delete(ip);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many failed attempts. Try again in ${rateLimit.remainingSec} seconds.` },
      { status: 429 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON request" }, { status: 400 });
  }

  const { username, password } = body;
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  const cleanUser = String(username).trim();
  const cleanPass = String(password).trim();

  // 1. Check Super Admin (Permanent, never expires)
  if (cleanUser.toLowerCase() === authState.superAdmin.username.toLowerCase()) {
    const valid = verifyPassword(cleanPass, authState.superAdmin.passwordHash, authState.superAdmin.salt);
    if (!valid) {
      recordFailedAttempt(ip);
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    recordSuccessfulAttempt(ip);
    const token = signToken({
      userId: authState.superAdmin.id,
      username: authState.superAdmin.username,
      role: "superadmin",
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: authState.superAdmin.id,
        username: authState.superAdmin.username,
        role: "superadmin",
        name: authState.superAdmin.name,
      },
      redirectTo: "/admin",
    });

    // Set HTTP-Only Cookie
    response.cookies.set("mc_auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  }

  // 2. Check 15-Day Trial Account
  if (cleanUser.toLowerCase() === authState.trial.username.toLowerCase()) {
    const valid = verifyPassword(cleanPass, authState.trial.passwordHash, authState.trial.salt);
    if (!valid) {
      recordFailedAttempt(ip);
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const trialStatus = getTrialStatus();

    // Check if trial is disabled or expired
    if (trialStatus.isDisabled) {
      return NextResponse.json(
        {
          error: "trial_disabled",
          message: "This trial account has been disabled by the system administrator.",
        },
        { status: 403 }
      );
    }

    if (trialStatus.isExpired) {
      return NextResponse.json(
        {
          error: "trial_expired",
          message: "Your 15-Day Free Trial Has Expired. Please contact system administrator: 03152914836.",
          trialStatus,
        },
        { status: 403 }
      );
    }

    recordSuccessfulAttempt(ip);
    const token = signToken({
      userId: "trial_01",
      username: authState.trial.username,
      role: "trial",
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: "trial_01",
        username: authState.trial.username,
        role: "trial",
        name: "Trial Account",
      },
      trialStatus,
      redirectTo: "/dashboard",
    });

    response.cookies.set("mc_auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  }

  // No match
  recordFailedAttempt(ip);
  return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
}
