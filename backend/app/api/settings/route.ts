export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";

export async function GET() {
  try {
    const res = await fetchFromCSharp("api/oilshop/settings");
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    // Return sensible default settings if backend is starting
    return NextResponse.json({
      shopName: "Petrol Pump & Oil Shop",
      phone: "",
      address: "",
      currency: "PKR"
    });
  }

  return NextResponse.json(
    { error: "Could not fetch shop settings" },
    { status: 502 }
  );
}
