import { NextResponse } from "next/server";
import { saveSignature, deleteSignature, getSignatureImage } from "@/lib/db";
import { storageGuard, serverError } from "@/lib/apiHelpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const sig = await getSignatureImage();
  if (!sig) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(sig.bytes, {
    status: 200,
    headers: { "Content-Type": sig.mime, "Cache-Control": "no-store" },
  });
}

export async function POST(request) {
  const blocked = storageGuard();
  if (blocked) return blocked;
  try {
    const { dataUrl } = await request.json();
    const result = await saveSignature(dataUrl);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result.company);
  } catch (err) {
    return serverError(err, "Failed to upload signature.");
  }
}

export async function DELETE() {
  const blocked = storageGuard();
  if (blocked) return blocked;
  try {
    return NextResponse.json(await deleteSignature());
  } catch (err) {
    return serverError(err, "Failed to remove signature.");
  }
}
