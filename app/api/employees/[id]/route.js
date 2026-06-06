import { NextResponse } from "next/server";
import { getEmployee, updateEmployee, deleteEmployee } from "@/lib/db";
import { storageGuard, serverError } from "@/lib/apiHelpers";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const employee = await getEmployee(params.id);
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(employee);
}

export async function PUT(request, { params }) {
  const blocked = storageGuard();
  if (blocked) return blocked;
  try {
    const data = await request.json();
    const employee = await updateEmployee(params.id, data);
    if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(employee);
  } catch (err) {
    return serverError(err, "Failed to update employee.");
  }
}

export async function DELETE(_request, { params }) {
  const blocked = storageGuard();
  if (blocked) return blocked;
  try {
    const ok = await deleteEmployee(params.id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err, "Failed to delete employee.");
  }
}
