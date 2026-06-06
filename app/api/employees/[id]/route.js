import { NextResponse } from "next/server";
import { getEmployee, updateEmployee, deleteEmployee } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const employee = await getEmployee(params.id);
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(employee);
}

export async function PUT(request, { params }) {
  const data = await request.json();
  const employee = await updateEmployee(params.id, data);
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(employee);
}

export async function DELETE(_request, { params }) {
  const ok = await deleteEmployee(params.id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
