import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { EMPLOYEE_COLUMNS } from "@/lib/employeeColumns";

export const dynamic = "force-dynamic";

// Generates a demo .xlsx with the expected headers and two example rows.
export async function GET() {
  const headers = EMPLOYEE_COLUMNS.map((c) => c.header);
  const row1 = {};
  const row2 = {};
  for (const c of EMPLOYEE_COLUMNS) {
    row1[c.header] = c.example;
    row2[c.header] = c.example2;
  }

  const ws = XLSX.utils.json_to_sheet([row1, row2], { header: headers });
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(14, h.length + 2) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employees");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="employee-upload-template.xlsx"',
    },
  });
}
