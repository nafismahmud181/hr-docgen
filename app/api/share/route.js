import { NextResponse } from "next/server";
import { getEmployee, createShare } from "@/lib/db";
import { generatePdf } from "@/lib/pdf";
import { DOC_TYPES } from "@/lib/templates";
import { storageGuard, serverError } from "@/lib/apiHelpers";

export const dynamic = "force-dynamic";

// Generates the document, stores it, and returns a shareable link id.
export async function POST(request) {
  const blocked = storageGuard();
  if (blocked) return blocked;
  try {
    const { employeeId, docType, purpose, issueDate, override } = await request.json();

    const employee = await getEmployee(employeeId);
    if (!employee) return NextResponse.json({ error: "Employee not found." }, { status: 404 });

    const type = DOC_TYPES.find((t) => t.key === docType);
    if (!type) return NextResponse.json({ error: "Unknown document type." }, { status: 400 });

    if (!override) {
      const missing = (type.needs || []).filter((f) => !employee[f]);
      if (missing.length) {
        return NextResponse.json(
          { error: `This document requires the following employee field(s): ${missing.join(", ")}.` },
          { status: 400 }
        );
      }
    }

    const pdf = await generatePdf(docType, employee, { purpose, issueDate, override });
    const safeName = employee.name.replace(/[^a-z0-9]+/gi, "_");
    const fileName = `${type.code}_${safeName}.pdf`;

    const share = await createShare(
      {
        employeeId,
        employeeName: employee.name,
        docType,
        docLabel: type.label,
        fileName,
        issueDate: issueDate || null,
      },
      pdf
    );

    return NextResponse.json({ id: share.id, fileName });
  } catch (err) {
    return serverError(err, "Failed to create share link.");
  }
}
