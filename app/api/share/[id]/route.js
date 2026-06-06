import { NextResponse } from "next/server";
import { getShare, getSharePdf, deleteShare } from "@/lib/db";
import { storageGuard, serverError } from "@/lib/apiHelpers";

export const dynamic = "force-dynamic";

// Public download of a shared document (anyone with the link).
export async function GET(_request, { params }) {
  const share = await getShare(params.id);
  if (!share) return new NextResponse("This link is invalid or has been revoked.", { status: 404 });
  const pdf = await getSharePdf(params.id);
  if (!pdf) return new NextResponse("The document is no longer available.", { status: 404 });
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${share.fileName}"`,
    },
  });
}

export async function DELETE(_request, { params }) {
  const blocked = storageGuard();
  if (blocked) return blocked;
  try {
    const ok = await deleteShare(params.id);
    if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err, "Failed to revoke link.");
  }
}
