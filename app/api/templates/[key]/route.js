import { NextResponse } from "next/server";
import { getTemplate, saveTemplate, resetTemplate } from "@/lib/db";
import { storageGuard, serverError } from "@/lib/apiHelpers";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const template = await getTemplate(params.key);
  if (!template) return NextResponse.json({ error: "Unknown template." }, { status: 404 });
  return NextResponse.json(template);
}

export async function PUT(request, { params }) {
  const blocked = storageGuard();
  if (blocked) return blocked;
  try {
    const data = await request.json();
    const result = await saveTemplate(params.key, data);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result.template);
  } catch (err) {
    return serverError(err, "Failed to save template.");
  }
}

export async function DELETE(_request, { params }) {
  const blocked = storageGuard();
  if (blocked) return blocked;
  try {
    const template = await resetTemplate(params.key);
    if (!template) return NextResponse.json({ error: "Unknown template." }, { status: 404 });
    return NextResponse.json(template);
  } catch (err) {
    return serverError(err, "Failed to reset template.");
  }
}
