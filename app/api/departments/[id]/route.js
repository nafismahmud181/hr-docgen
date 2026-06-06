import { NextResponse } from "next/server";
import { deleteDepartment } from "@/lib/db";
import { storageGuard, serverError } from "@/lib/apiHelpers";

export const dynamic = "force-dynamic";

export async function DELETE(_request, { params }) {
  const blocked = storageGuard();
  if (blocked) return blocked;
  try {
    const ok = await deleteDepartment(params.id);
    if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err, "Failed to delete department.");
  }
}
