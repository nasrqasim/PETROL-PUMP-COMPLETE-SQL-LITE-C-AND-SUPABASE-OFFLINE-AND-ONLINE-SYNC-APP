import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { GariSchema } from "@/lib/validations";
import { memoryStore } from "@/lib/memory-store";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const res = await fetchFromCSharp(`api/gariyan/${params.id}`);
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: res.status });
    }
  } catch (error) {
    // Fallback to memoryStore
  }

  const id = Number(params.id);
  const item = memoryStore.gariyan.find((g) => g.id === id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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
    const res = await fetchFromCSharp(`api/gariyan/${params.id}`, {
      method: "PUT",
      body: JSON.stringify(validated.data),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: res.status });
    }
  } catch (error) {
    // Fallback to memoryStore
  }

  const id = Number(params.id);
  const idx = memoryStore.gariyan.findIndex((g) => g.id === id);
  if (idx !== -1) {
    memoryStore.gariyan[idx] = {
      ...memoryStore.gariyan[idx],
      gariNo: validated.data.gariNo,
      driverName: validated.data.driverName,
      malik: validated.data.malik || "Apni",
      phone: validated.data.phone || "",
    };
    return NextResponse.json(memoryStore.gariyan[idx]);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const res = await fetchFromCSharp(`api/gariyan/${params.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      return NextResponse.json({ message: "Vehicle deleted successfully" });
    }
  } catch (error) {
    // Fallback to memoryStore
  }

  const id = Number(params.id);
  const idx = memoryStore.gariyan.findIndex((g) => g.id === id);
  if (idx !== -1) {
    memoryStore.gariyan.splice(idx, 1);
    return NextResponse.json({ message: "Vehicle deleted successfully" });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
