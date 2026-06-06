import { company as companyDefault } from "./config";

// ── Helpers ────────────────────────────────────────────────────────────

export function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d)) return value;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatMoney(value) {
  const n = Number(String(value).replace(/[^\d.]/g, ""));
  if (isNaN(n) || n <= 0) return "";
  return "BDT " + n.toLocaleString("en-IN") + "/-";
}

function pronouns(gender) {
  const g = (gender || "").toLowerCase();
  if (g === "male") return { salutation: "Mr.", he: "he", him: "him", his: "his" };
  if (g === "female") return { salutation: "Ms.", he: "she", him: "her", his: "her" };
  return { salutation: "", he: "they", him: "them", his: "their" };
}

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// ── Document type registry ─────────────────────────────────────────────

export const DOC_TYPES = [
  { key: "experience", label: "Experience Letter", code: "EXP", needs: ["lastWorkingDate"] },
  { key: "loe", label: "Letter of Employment (LOE)", code: "LOE", needs: [] },
  { key: "noc", label: "No Objection Certificate (NOC)", code: "NOC", needs: [], hasPurpose: true },
  { key: "salary", label: "Salary Certificate", code: "SAL", needs: ["salary"] },
];

// ── Editable templates (placeholder-based) ─────────────────────────────
// These are the defaults. They can be overridden per type and persisted via
// lib/db.js (data/templates.json). Tokens in {{double braces}} are filled in
// from the employee + company at generation time (see buildContext / render).

export const DEFAULT_TEMPLATES = {
  experience: {
    title: "EXPERIENCE LETTER",
    addressee: "TO WHOM IT MAY CONCERN",
    paragraphs: [
      "This is to certify that {{salutation}} {{name}} was employed with {{company}} as {{designation}} in the {{department}} department from {{joiningDate}} to {{lastWorkingDate}}.",
      "During {{his}} tenure with us, {{salutation}} {{name}} was found to be sincere, diligent, and professional. {{He}} carried out {{his}} responsibilities with dedication and maintained an excellent record of conduct and performance.",
      "We wish {{him}} every success in {{his}} future endeavors.",
    ],
    closing: "Sincerely,",
  },
  loe: {
    title: "LETTER OF EMPLOYMENT",
    addressee: "TO WHOM IT MAY CONCERN",
    paragraphs: [
      "This is to certify that {{salutation}} {{name}} is currently employed with {{company}} as {{designation}} in the {{department}} department, and has been working with us since {{joiningDate}} as a {{employmentType}} employee.",
      "{{He}} currently draws a monthly gross salary of {{salary}}.",
      "This letter is issued at the request of the employee for whatever legitimate purpose it may serve. For any verification, please feel free to contact us at {{email}}.",
    ],
    closing: "Sincerely,",
  },
  noc: {
    title: "NO OBJECTION CERTIFICATE",
    addressee: "TO WHOM IT MAY CONCERN",
    paragraphs: [
      "This is to certify that {{salutation}} {{name}} is employed with {{company}} as {{designation}} in the {{department}} department since {{joiningDate}}.",
      "{{company}} has no objection to {{name}} {{purpose}}. {{He}} has been granted the necessary permission, and {{his}} employment with us will remain unaffected.",
      "This certificate is issued at the request of the employee. For any verification, please contact us at {{email}}.",
    ],
    closing: "Sincerely,",
  },
  salary: {
    title: "SALARY CERTIFICATE",
    addressee: "TO WHOM IT MAY CONCERN",
    paragraphs: [
      "This is to certify that {{salutation}} {{name}} is employed with {{company}} as {{designation}} in the {{department}} department since {{joiningDate}}.",
      "{{He}} currently draws a monthly gross salary of {{salary}}.",
      "This certificate is issued at the request of the employee for whatever legitimate purpose it may serve. For any verification, please feel free to contact us at {{email}}.",
    ],
    closing: "Sincerely,",
  },
};

// Tokens offered in the template editor's "insert placeholder" palette.
export const PLACEHOLDERS = [
  { token: "{{name}}", label: "Employee name" },
  { token: "{{salutation}}", label: "Mr. / Ms." },
  { token: "{{designation}}", label: "Designation" },
  { token: "{{department}}", label: "Department" },
  { token: "{{employeeCode}}", label: "Employee ID" },
  { token: "{{employmentType}}", label: "Employment type" },
  { token: "{{joiningDate}}", label: "Joining date" },
  { token: "{{lastWorkingDate}}", label: "Last working date" },
  { token: "{{salary}}", label: "Monthly salary" },
  { token: "{{purpose}}", label: "Purpose (NOC)" },
  { token: "{{company}}", label: "Company name" },
  { token: "{{email}}", label: "Company email" },
  { token: "{{website}}", label: "Website" },
  { token: "{{he}}", label: "he / she / they" },
  { token: "{{his}}", label: "his / her / their" },
  { token: "{{him}}", label: "him / her / them" },
];

// A fully-populated employee used to render template previews on the pad.
export const SAMPLE_EMPLOYEE = {
  id: "sample",
  name: "Farhana Rahman",
  gender: "female",
  employeeCode: "IW-0042",
  designation: "Software Engineer",
  department: "Engineering",
  employmentType: "Permanent, full-time",
  joiningDate: "2023-02-01",
  lastWorkingDate: "2026-05-31",
  salary: "85000",
};

export const SAMPLE_PURPOSE = "applying for a visit visa to Singapore from 10–20 July 2026";

function buildContext(emp, company, options) {
  const p = pronouns(emp.gender);
  return {
    name: emp.name || "",
    salutation: p.salutation || "",
    designation: emp.designation || "",
    department: emp.department || "",
    employeeCode: emp.employeeCode || "",
    employmentType: emp.employmentType || "",
    joiningDate: formatDate(emp.joiningDate),
    lastWorkingDate: formatDate(emp.lastWorkingDate),
    salary: formatMoney(emp.salary),
    company: company.name || "",
    email: company.email || "",
    website: company.website || "",
    he: p.he,
    He: cap(p.he),
    him: p.him,
    his: p.his,
    His: cap(p.his),
    purpose: (options.purpose || "").trim().replace(/\.+$/, ""),
  };
}

// Replace {{token}} with values; unknown tokens are left intact so typos are
// visible. Afterwards, tidy whitespace left by empty fields.
function render(str, ctx) {
  if (!str) return "";
  return String(str)
    .replace(/\{\{\s*([A-Za-z]+)\s*\}\}/g, (m, key) =>
      Object.prototype.hasOwnProperty.call(ctx, key) ? ctx[key] ?? "" : m
    )
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([.,;])/g, "$1")
    .trim();
}

export function buildDocument(typeKey, emp, options = {}) {
  const type = DOC_TYPES.find((t) => t.key === typeKey);
  if (!type) throw new Error("Unknown document type: " + typeKey);

  const company = options.company || companyDefault;
  const tpl = options.template || DEFAULT_TEMPLATES[typeKey];
  const ctx = buildContext(emp, company, options);

  return {
    refCode: type.code,
    title: render(tpl.title, ctx),
    addressee: render(tpl.addressee, ctx),
    paragraphs: (tpl.paragraphs || []).map((para) => render(para, ctx)).filter((para) => para),
    closing: render(tpl.closing, ctx),
  };
}

export function buildRefNumber(typeKey, emp, co) {
  const company = co || companyDefault;
  const type = DOC_TYPES.find((t) => t.key === typeKey);
  const year = new Date().getFullYear();
  const tail = emp.employeeCode ? emp.employeeCode.replace(/\s+/g, "") : emp.id.slice(0, 6).toUpperCase();
  return `${company.refPrefix}/${type.code}/${year}/${tail}`;
}
