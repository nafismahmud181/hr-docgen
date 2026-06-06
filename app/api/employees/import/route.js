import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createEmployees } from "@/lib/db";
import { resolveField } from "@/lib/employeeColumns";

export const dynamic = "force-dynamic";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function normalizeValue(field, value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date && !isNaN(value)) {
    // Dates that should stay as plain calendar dates (YYYY-MM-DD)
    if (field === "joiningDate" || field === "lastWorkingDate") {
      return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
    }
  }
  let v = String(value).trim();
  if (field === "gender") {
    v = v.toLowerCase();
    if (v !== "male" && v !== "female") v = "other";
  }
  if (field === "status") {
    if (!v) return "Present";
    const c = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
    return ["Present", "Fired", "Resigned"].includes(c) ? c : v;
  }
  if (field === "salary") v = v.replace(/[^\d.]/g, "");
  return v;
}

export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    let wb;
    try {
      wb = XLSX.read(buf, { type: "buffer", cellDates: true });
    } catch {
      return NextResponse.json({ error: "Could not read the file. Please upload a valid .xlsx file." }, { status: 400 });
    }

    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) return NextResponse.json({ error: "The workbook has no sheets." }, { status: 400 });

    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const valid = [];
    const errors = [];
    rows.forEach((row, i) => {
      const rowNum = i + 2; // +1 for header, +1 for 1-based
      const emp = {};
      for (const [rawKey, val] of Object.entries(row)) {
        const field = resolveField(rawKey);
        if (field) emp[field] = normalizeValue(field, val);
      }
      // Skip entirely blank rows silently
      if (Object.values(emp).every((v) => !String(v).trim())) return;
      if (!emp.name || !emp.designation) {
        errors.push({ row: rowNum, reason: "Missing required Name or Designation" });
        return;
      }
      valid.push(emp);
    });

    const created = valid.length ? createEmployees(valid) : [];
    return NextResponse.json({ created: created.length, skipped: errors.length, errors });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to import employees." }, { status: 500 });
  }
}
