import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { supabaseServer } from "@/lib/supabase";
import { memoryStore, StaffData } from "@/lib/memory-store";

export async function GET() {
  try {
    const res = await fetchFromCSharp("api/oilshop/staff");
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    if (supabaseServer) {
      try {
        const { data, error } = await supabaseServer
          .from("staff")
          .select("*, role:roles(*)")
          .eq("is_deleted", false)
          .order("name");
        if (!error && data && data.length > 0) return NextResponse.json(data);
      } catch (e) {}
    }
  }

  return NextResponse.json(memoryStore.staff);
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const res = await fetchFromCSharp("api/oilshop/staff", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { status: 201 });
    }
  } catch (err) {}

  const newStaff: StaffData = {
    Id: Date.now(),
    Name: body.Name || "Staff Member",
    Designation: body.Designation || "Employee",
    Department: body.Department || "General",
    ContactNumber: body.ContactNumber || "",
    Address: body.Address || "",
    Cnic: body.Cnic || "",
    Salary: Number(body.Salary || 0),
    IsActive: true,
  };

  memoryStore.staff.unshift(newStaff);
  return NextResponse.json(newStaff, { status: 201 });
}
