export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { memoryStore, VehicleDailyStatusRecord } from "@/lib/memory-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetDate = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const statusFilter = searchParams.get("status") || "all";
  const search = (searchParams.get("search") || "").trim().toLowerCase();

  const allVehicles = memoryStore.gariyan;
  const recordedStatuses = memoryStore.vehicleStatuses.filter((s) => s.date === targetDate);
  const todayTrips = memoryStore.roznamcha.filter((r) => r.date === targetDate);

  // Build unified view: Every registered vehicle must appear in the list
  const vehicleList = allVehicles.map((v) => {
    const existing = recordedStatuses.find(
      (s) => s.gariNo.trim().toUpperCase() === v.gariNo.trim().toUpperCase()
    );

    const vehicleTripsToday = todayTrips.filter(
      (r) => r.gariNo.trim().toUpperCase() === v.gariNo.trim().toUpperCase()
    );

    const hasTodayEntry = !!existing && !!existing.tripId;

    if (existing) {
      return {
        ...existing,
        vehicleName: v.capacity ? `${v.capacity} (${v.malik})` : v.malik,
        contactPhone: v.phone,
        hasTodayEntry: true,
        tripsTodayCount: vehicleTripsToday.length,
        todayTrips: vehicleTripsToday,
      };
    }

    // Default status for vehicle with no entry on this date
    return {
      id: v.id * 1000,
      gariNo: v.gariNo,
      vehicleName: v.capacity ? `${v.capacity} (${v.malik})` : v.malik,
      driverName: v.driverName || "Assigned Driver",
      date: targetDate,
      tripId: undefined,
      tripNumber: undefined,
      startingLocation: "Site Area Hub Base Yard",
      currentLocation: "Site Area Hub Base Yard",
      destination: "Available / At Base",
      departureTime: undefined,
      expectedReturn: undefined,
      status: "Available / At Base" as const,
      lastUpdated: `${targetDate} 06:00 AM`,
      updatedBy: "System (Ready for Dispatch)",
      contactPhone: v.phone,
      hasTodayEntry: false,
      tripsTodayCount: 0,
      todayTrips: [],
    };
  });

  // Calculate top summary cards
  const totalRegistered = allVehicles.length;
  const activeToday = vehicleList.filter((v) => v.hasTodayEntry).length;
  const onTrip = vehicleList.filter(
    (v) => v.status === "On the Way" || v.status === "Returning"
  ).length;
  const atLoading = vehicleList.filter(
    (v) => v.status === "Loading" || v.status === "Loaded / Ready to Depart"
  ).length;
  const atDestination = vehicleList.filter(
    (v) => v.status === "At Destination" || v.status === "Unloading"
  ).length;
  const returned = vehicleList.filter(
    (v) => v.status === "Returned to Base" || v.status === "Trip Completed"
  ).length;
  const tripsCompleted = vehicleList.filter((v) => v.status === "Trip Completed").length;
  const tripsPending = vehicleList.filter(
    (v) => v.hasTodayEntry && v.status !== "Trip Completed" && v.status !== "Returned to Base"
  ).length;
  const noEntryToday = vehicleList.filter((v) => !v.hasTodayEntry).length;

  // Filter by status tab & search
  let filtered = vehicleList;

  if (statusFilter && statusFilter !== "all") {
    if (statusFilter === "No Entry Today") {
      filtered = filtered.filter((v) => !v.hasTodayEntry);
    } else {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }
  }

  if (search) {
    filtered = filtered.filter((v) => {
      return (
        v.gariNo.toLowerCase().includes(search) ||
        v.driverName.toLowerCase().includes(search) ||
        (v.tripNumber && v.tripNumber.toLowerCase().includes(search)) ||
        v.currentLocation.toLowerCase().includes(search) ||
        v.destination.toLowerCase().includes(search) ||
        v.startingLocation.toLowerCase().includes(search)
      );
    });
  }

  return NextResponse.json({
    summary: {
      totalRegistered,
      activeToday,
      onTrip,
      atLoading,
      atDestination,
      returned,
      tripsCompleted,
      tripsPending,
      noEntryToday,
      date: targetDate,
    },
    vehicles: filtered,
  });
}
