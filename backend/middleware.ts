import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const JWT_SECRET = process.env.AUTH_SECRET || "muslim-construction-secret-key-roonjha-2026-secure-transport";

// Lightweight Web Crypto HMAC-SHA256 verification for Edge/Node Middleware
async function verifyTokenEdge(token: string): Promise<{ valid: boolean; payload?: any }> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return { valid: false };

    const [headerB64, bodyB64, sigB64] = parts;
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${bodyB64}`);

    // Import HMAC key
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Decode signature from base64url
    const sigBinary = Uint8Array.from(
      atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify("HMAC", key, sigBinary, data);
    if (!valid) return { valid: false };

    const payloadJson = atob(bodyB64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false };
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Always allow static files, images, manifest, service worker
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/public") ||
    pathname === "/manifest.json" ||
    pathname === "/favicon.ico" ||
    pathname === "/sw.js"
  ) {
    return NextResponse.next();
  }

  // 2. Public web pages and auth APIs
  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/trial-expired";
  const isAuthApi = pathname.startsWith("/api/auth/login") || pathname.startsWith("/api/auth/logout");

  const token = req.cookies.get("mc_auth_token")?.value;
  const tokenResult = token ? await verifyTokenEdge(token) : { valid: false };

  // 3. If user is on /login and is already authenticated, redirect to appropriate destination
  if (pathname === "/login" && tokenResult.valid && tokenResult.payload) {
    const target = tokenResult.payload.role === "superadmin" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(target, req.url));
  }

  // 4. If public page or auth api, allow through
  if (isPublicPage || isAuthApi) {
    return NextResponse.next();
  }

  // 5. Protected API routes (/api/*)
  if (pathname.startsWith("/api/")) {
    if (!tokenResult.valid || !tokenResult.payload) {
      return NextResponse.json({ error: "Unauthorized access. Please login." }, { status: 401 });
    }
    // Trial check: If accessing /api/auth/trial and not superadmin
    if (pathname.startsWith("/api/auth/trial") && tokenResult.payload.role !== "superadmin") {
      return NextResponse.json({ error: "Super Admin privileges required." }, { status: 403 });
    }
    return NextResponse.next();
  }

  // 6. Protected ERP Pages (/dashboard, /daily-ledger, /customers, etc.)
  if (!tokenResult.valid || !tokenResult.payload) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 7. Protected Admin Page (/admin) - Super Admin only
  if (pathname.startsWith("/admin") && tokenResult.payload.role !== "superadmin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
