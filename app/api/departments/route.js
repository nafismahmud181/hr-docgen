import { NextResponse } from "next/server";
import { getDepartments, createDepartment } from "@/lib/db";
import { storageGuard, serverError } from "@/lib/apiHelpers";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getDepartments());
}

export async function POST(request) {
  const blocked = storageGuard();
  if (blocked) return blocked;
  try {
    const { name } = await request.json();
    const result = await createDepartment(name);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result.item, { status: 201 });
  } catch (err) {
    return serverError(err, "Failed to add department.");
  }
}
