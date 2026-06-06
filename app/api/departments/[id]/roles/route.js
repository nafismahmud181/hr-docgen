import { NextResponse } from "next/server";
import { createRole } from "@/lib/db";
import { storageGuard, serverError } from "@/lib/apiHelpers";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const blocked = storageGuard();
  if (blocked) return blocked;
  try {
    const { name } = await request.json();
    const result = await createRole(params.id, name);
    if (result.error) {
      const status = result.error === "Department not found." ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json(result.item, { status: 201 });
  } catch (err) {
    return serverError(err, "Failed to add role.");
  }
}
