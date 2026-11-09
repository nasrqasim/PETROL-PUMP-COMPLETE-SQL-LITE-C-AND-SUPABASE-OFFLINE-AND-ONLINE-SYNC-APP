import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { RoznamchaSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const endpoint = queryString ? `api/roznamcha?${queryString}` : "api/roznamcha";

    const res = await fetchFromCSharp(endpoint);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to connect to local SQLite/C# Roznamcha bridge", details: error.message },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = RoznamchaSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const res = await fetchFromCSharp("api/roznamcha", {
      method: "POST",
      body: JSON.stringify(validated.data),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to save entry to C# + SQLite bridge", details: error.message },
      { status: 502 }
    );
  }
}
