export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { updateVehicleStatus } from "@/lib/accounting";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { gariNo, status, currentLocation } = body;
  if (!gariNo || !status || !currentLocation) {
    return NextResponse.json(
      { error: "Vehicle number, status, and current location are required." },
      { status: 400 }
    );
  }

  try {
    const result = updateVehicleStatus({
      gariNo: String(gariNo).trim(),
      driverName: body.driverName ? String(body.driverName).trim() : undefined,
      status: body.status,
      currentLocation: String(currentLocation).trim(),
      destination: body.destination ? String(body.destination).trim() : undefined,
      tripId: body.tripId ? Number(body.tripId) : undefined,
      remarks: body.remarks ? String(body.remarks).trim() : undefined,
      date: body.date ? String(body.date).trim() : undefined,
      time: body.time ? String(body.time).trim() : undefined,
      updatedBy: body.updatedBy ? String(body.updatedBy).trim() : "Operations Officer",
    });

    return NextResponse.json({
      success: true,
      message: `Status updated for vehicle ${gariNo} to "${status}".`,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update vehicle status." },
      { status: 500 }
    );
  }
}
