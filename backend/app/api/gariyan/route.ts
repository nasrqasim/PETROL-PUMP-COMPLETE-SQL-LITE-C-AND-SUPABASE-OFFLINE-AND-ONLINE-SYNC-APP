import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { GariSchema } from "@/lib/validations";

export async function GET() {
  try {
    const res = await fetchFromCSharp("api/gariyan");
    const data = await res.json().catch(() => ([]));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to connect to local SQLite/C# Gariyan bridge", details: error.message },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = GariSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const res = await fetchFromCSharp("api/gariyan", {
      method: "POST",
      body: JSON.stringify(validated.data),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to save vehicle to C# + SQLite bridge", details: error.message },
      { status: 502 }
    );
  }
}
