import { NextResponse } from "next/server";
import { deleteRole } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(_request, { params }) {
  const ok = deleteRole(params.id, params.roleId);
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
