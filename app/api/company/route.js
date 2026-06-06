import { NextResponse } from "next/server";
import { getCompany, saveCompany } from "@/lib/db";
import { storageGuard, serverError } from "@/lib/apiHelpers";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getCompany());
}

export async function PUT(request) {
  const blocked = storageGuard();
  if (blocked) return blocked;
  try {
    const data = await request.json();
    const company = await saveCompany(data);
    return NextResponse.json(company);
  } catch (err) {
    return serverError(err, "Failed to save settings.");
  }
}
