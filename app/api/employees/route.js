import { NextResponse } from "next/server";
import { getEmployees, createEmployee } from "@/lib/db";
import { storageGuard, serverError } from "@/lib/apiHelpers";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getEmployees());
}

export async function POST(request) {
  const blocked = storageGuard();
  if (blocked) return blocked;
  try {
    const data = await request.json();
    if (!data.name || !data.designation) {
      return NextResponse.json(
        { error: "Name and designation are required." },
        { status: 400 }
      );
    }
    const employee = await createEmployee(data);
    return NextResponse.json(employee, { status: 201 });
  } catch (err) {
    return serverError(err, "Failed to save employee.");
  }
}
