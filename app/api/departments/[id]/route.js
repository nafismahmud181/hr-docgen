import { NextResponse } from "next/server";
import { deleteDepartment } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(_request, { params }) {
  const ok = deleteDepartment(params.id);
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
