export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { memoryStore } from "@/lib/memory-store";

export async function GET(
  req: NextRequest,
  { params }: { params: { gariNo: string } }
) {
  const gUpper = decodeURIComponent(params.gariNo).trim().toUpperCase();

  const vehicle = memoryStore.gariyan.find(
    (g) => g.gariNo.trim().toUpperCase() === gUpper
  );

  // Status updates timeline
  const statusHistory = memoryStore.vehicleStatusHistory
    .filter((h) => h.gariNo.trim().toUpperCase() === gUpper)
    .sort((a, b) => {
      // Sort newest first
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.id - a.id;
    });

  // Recorded Roznamcha trips for this vehicle
  const trips = memoryStore.roznamcha
    .filter((r) => r.gariNo.trim().toUpperCase() === gUpper)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Aggregate Metrics
  const totalTrips = trips.length;
  const totalFreight = trips.reduce((sum, t) => sum + (Number(t.kiraya) || 0), 0);
  const totalTripExpenses = trips.reduce(
    (sum, t) => sum + (Number(t.kharcha) || 0) + (Number(t.otherExpenseAmount) || 0),
    0
  );
  const totalDieselLiters = trips.reduce((sum, t) => sum + (Number(t.dieselLiter) || 0), 0);
  const totalNetContribution = trips.reduce((sum, t) => sum + (Number(t.baqaya) || 0), 0);

  // Completed vs Pending trips
  const completedTripsCount = statusHistory.filter(
    (h) => h.status === "Trip Completed" || h.status === "Returned to Base"
  ).length;
  const pendingTripsCount = Math.max(0, totalTrips - completedTripsCount);

  return NextResponse.json({
    vehicle: vehicle || {
      gariNo: params.gariNo,
      driverName: "Assigned Driver",
      malik: "Muslim Construction Fleet",
      capacity: "Heavy Haulage Truck",
    },
    metrics: {
      totalTrips,
      completedTrips: completedTripsCount,
      pendingTrips: pendingTripsCount,
      totalFreight,
      totalTripExpenses,
      totalDieselLiters,
      totalNetContribution,
    },
    statusHistory,
    trips,
  });
}
