import { NextRequest, NextResponse } from "next/server";
import { fetchFromCSharp } from "@/lib/csharp-client";
import { RoznamchaSchema } from "@/lib/validations";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const res = await fetchFromCSharp(`api/roznamcha/${params.id}`);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch record from C# + SQLite bridge", details: error.message },
      { status: 502 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const validated = RoznamchaSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const res = await fetchFromCSharp(`api/roznamcha/${params.id}`, {
      method: "PUT",
      body: JSON.stringify(validated.data),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update record in C# + SQLite bridge", details: error.message },
      { status: 502 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const res = await fetchFromCSharp(`api/roznamcha/${params.id}`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete record in C# + SQLite bridge", details: error.message },
      { status: 502 }
    );
  }
}
