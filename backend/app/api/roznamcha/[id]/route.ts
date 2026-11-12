import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { RoznamchaSchema } from "@/lib/validations";
import { memoryStore } from "@/lib/memory-store";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const res = await fetchFromCSharp(`api/roznamcha/${params.id}`);
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: res.status });
    }
  } catch (error) {
    // Fallback to memoryStore
  }

  const id = Number(params.id);
  const item = memoryStore.roznamcha.find((r) => r.id === id);
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

  const validated = RoznamchaSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: validated.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const res = await fetchFromCSharp(`api/roznamcha/${params.id}`, {
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
  const idx = memoryStore.roznamcha.findIndex((r) => r.id === id);
  if (idx !== -1) {
    const d = validated.data;
    const itemDate = d.date || new Date().toISOString().split("T")[0];
    const kiraya = Number(d.kiraya) || 0;
    const kharcha = Number(d.kharcha) || 0;
    const advance = Number(d.advance) || 0;
    const baqaya = kiraya - kharcha - advance;

    memoryStore.roznamcha[idx] = {
      ...memoryStore.roznamcha[idx],
      date: itemDate,
      displayDate: new Date(itemDate).toLocaleDateString("en-GB"),
      gariNo: d.gariNo,
      driverName: d.driverName,
      maal: d.maal || "",
      dieselLiter: Number(d.dieselLiter) || 0,
      kiraya,
      kharcha,
      advance,
      baqaya,
    };
    return NextResponse.json(memoryStore.roznamcha[idx]);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const res = await fetchFromCSharp(`api/roznamcha/${params.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      return NextResponse.json({ message: "Record deleted successfully" });
    }
  } catch (error) {
    // Fallback to memoryStore
  }

  const id = Number(params.id);
  const idx = memoryStore.roznamcha.findIndex((r) => r.id === id);
  if (idx !== -1) {
    memoryStore.roznamcha.splice(idx, 1);
    return NextResponse.json({ message: "Record deleted successfully" });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
