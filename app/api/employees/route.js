import { NextResponse } from "next/server";
import { getEmployees, createEmployee } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getEmployees());
}

export async function POST(request) {
  const data = await request.json();
  if (!data.name || !data.designation) {
    return NextResponse.json(
      { error: "Name and designation are required." },
      { status: 400 }
    );
  }
  const employee = createEmployee(data);
  return NextResponse.json(employee, { status: 201 });
}
