import { NextResponse } from "next/server";
import { createRole } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const { name } = await request.json();
  const result = createRole(params.id, name);
  if (result.error) {
    const status = result.error === "Department not found." ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result.item, { status: 201 });
}
