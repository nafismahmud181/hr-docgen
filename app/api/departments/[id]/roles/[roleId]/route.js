import { NextResponse } from "next/server";
import { deleteRole } from "@/lib/db";
import { storageGuard, serverError } from "@/lib/apiHelpers";

export const dynamic = "force-dynamic";

export async function DELETE(_request, { params }) {
  const blocked = storageGuard();
  if (blocked) return blocked;
  try {
    const ok = await deleteRole(params.id, params.roleId);
    if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err, "Failed to delete role.");
  }
}
