import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { GariSchema } from "@/lib/validations";
import { memoryStore } from "@/lib/memory-store";

export async function GET() {
  try {
    const res = await fetchFromCSharp("api/gariyan");
    if (res.ok) {
      const data = await res.json().catch(() => ([]));
      return NextResponse.json(data);
    }
  } catch (error) {
    // Fallback to memoryStore
  }

  return NextResponse.json(memoryStore.gariyan);
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validated = GariSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: validated.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const res = await fetchFromCSharp("api/gariyan", {
      method: "POST",
      body: JSON.stringify(validated.data),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: res.status });
    }
  } catch (error) {
    // Fallback to memoryStore
  }

  const newGari = {
    id: Date.now(),
    gariNo: validated.data.gariNo,
    driverName: validated.data.driverName,
    malik: validated.data.malik || "Apni",
    phone: validated.data.phone || "",
    modelYear: "2024",
    capacity: "15 Ton",
    status: "Active",
  };

  memoryStore.gariyan.push(newGari);
  return NextResponse.json(newGari, { status: 201 });
}
