import { NextResponse } from "next/server";
import { generatePdf } from "@/lib/pdf";
import { DOC_TYPES, SAMPLE_EMPLOYEE, SAMPLE_PURPOSE } from "@/lib/templates";

export const dynamic = "force-dynamic";

// Renders the given (possibly unsaved) template on the office pad using a
// sample employee, returned as an inline PDF for the editor's preview pane.
export async function POST(request) {
  try {
    const { docType, template } = await request.json();
    const type = DOC_TYPES.find((t) => t.key === docType);
    if (!type) return NextResponse.json({ error: "Unknown document type." }, { status: 400 });

    const pdf = await generatePdf(docType, SAMPLE_EMPLOYEE, {
      template,
      purpose: SAMPLE_PURPOSE,
      issueDate: new Date().toISOString(),
    });

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=template-preview.pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to render preview." }, { status: 500 });
  }
}
