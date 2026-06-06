import { NextResponse } from "next/server";
import { getEmployee } from "@/lib/db";
import { generatePdf } from "@/lib/pdf";
import { DOC_TYPES } from "@/lib/templates";
import { serverError } from "@/lib/apiHelpers";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { employeeId, docType, purpose, issueDate, override } = await request.json();

    const employee = await getEmployee(employeeId);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    const type = DOC_TYPES.find((t) => t.key === docType);
    if (!type) {
      return NextResponse.json({ error: "Unknown document type." }, { status: 400 });
    }

    // Validate required fields for this document type. Skipped when the user
    // has supplied one-off override text — they're then in full control of the
    // wording and may not rely on those fields.
    if (!override) {
      const missing = (type.needs || []).filter((f) => !employee[f]);
      if (missing.length) {
        return NextResponse.json(
          {
            error:
              `This document requires the following employee field(s): ${missing.join(", ")}. ` +
              `Please edit the employee profile first.`,
          },
          { status: 400 }
        );
      }
    }

    const pdf = await generatePdf(docType, employee, { purpose, issueDate, override });

    const safeName = employee.name.replace(/[^a-z0-9]+/gi, "_");
    const filename = `${type.code}_${safeName}.pdf`;

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return serverError(err, "Failed to generate document.");
  }
}
