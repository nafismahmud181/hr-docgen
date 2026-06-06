import { NextResponse } from "next/server";
import { saveSignature, deleteSignature, getSignatureImage } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const sig = getSignatureImage();
  if (!sig) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(sig.bytes, {
    status: 200,
    headers: { "Content-Type": sig.mime, "Cache-Control": "no-store" },
  });
}

export async function POST(request) {
  const { dataUrl } = await request.json();
  const result = saveSignature(dataUrl);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result.company);
}

export async function DELETE() {
  return NextResponse.json(deleteSignature());
}
