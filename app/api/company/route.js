import { NextResponse } from "next/server";
import { getCompany, saveCompany } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getCompany());
}

export async function PUT(request) {
  const data = await request.json();
  const company = saveCompany(data);
  return NextResponse.json(company);
}
