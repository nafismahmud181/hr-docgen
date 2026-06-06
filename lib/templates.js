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
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fullName(emp) {
  const p = pronouns(emp.gender);
  return p.salutation ? `${p.salutation} ${emp.name}` : emp.name;
}

// ── Document type registry ─────────────────────────────────────────────
//
// Each builder receives (employee, options) and returns:
//   { title, refCode, addressee, paragraphs: [string], closing }

export const DOC_TYPES = [
  { key: "experience", label: "Experience Letter", code: "EXP", needs: ["lastWorkingDate"] },
  { key: "loe", label: "Letter of Employment (LOE)", code: "LOE", needs: [] },
  { key: "noc", label: "No Objection Certificate (NOC)", code: "NOC", needs: [], hasPurpose: true },
  { key: "salary", label: "Salary Certificate", code: "SAL", needs: ["salary"] },
];

export function buildDocument(typeKey, emp, options = {}) {
  const p = pronouns(emp.gender);
  const name = fullName(emp);
  const type = DOC_TYPES.find((t) => t.key === typeKey);
  if (!type) throw new Error("Unknown document type: " + typeKey);
  const company = options.company || companyDefault;

  const base = {
    refCode: type.code,
    addressee: "TO WHOM IT MAY CONCERN",
    closing: "Sincerely,",
  };

  switch (typeKey) {
    case "experience":
      return {
        ...base,
        title: "EXPERIENCE LETTER",
        paragraphs: [
          `This is to certify that ${name} was employed with ${company.name} as ${emp.designation}` +
            (emp.department ? ` in the ${emp.department} department` : "") +
            ` from ${formatDate(emp.joiningDate)} to ${formatDate(emp.lastWorkingDate)}.`,
          `During ${p.his} tenure with us, ${name} was found to be sincere, diligent, and professional. ` +
            `${cap(p.he)} carried out ${p.his} responsibilities with dedication and maintained an excellent record of conduct and performance.`,
          `We wish ${p.him} every success in ${p.his} future endeavors.`,
        ],
      };

    case "loe":
      return {
        ...base,
        title: "LETTER OF EMPLOYMENT",
        paragraphs: [
          `This is to certify that ${name} is currently employed with ${company.name} as ${emp.designation}` +
            (emp.department ? ` in the ${emp.department} department` : "") +
            `, and has been working with us since ${formatDate(emp.joiningDate)}` +
            (emp.employmentType ? ` as a ${emp.employmentType.toLowerCase()} employee` : "") +
            `.`,
          emp.salary && options.includeSalary !== false
            ? `${cap(p.he)} currently draws a monthly gross salary of ${formatMoney(emp.salary)}.`
            : null,
          `This letter is issued at the request of the employee for whatever legitimate purpose it may serve. ` +
            `For any verification, please feel free to contact us at ${company.email}.`,
        ].filter(Boolean),
      };

    case "noc":
      return {
        ...base,
        title: "NO OBJECTION CERTIFICATE",
        paragraphs: [
          `This is to certify that ${name} is employed with ${company.name} as ${emp.designation}` +
            (emp.department ? ` in the ${emp.department} department` : "") +
            ` since ${formatDate(emp.joiningDate)}.`,
          options.purpose
            ? `${company.name} has no objection to ${name} ${options.purpose.trim().replace(/\.+$/, "")}. ` +
              `${cap(p.he)} has been granted the necessary permission, and ${p.his} employment with us will remain unaffected.`
            : `${company.name} has no objection regarding the above-mentioned employee for the purpose this certificate is requested. ` +
              `${cap(p.his)} employment with us remains unaffected.`,
          `This certificate is issued at the request of the employee. For any verification, please contact us at ${company.email}.`,
        ],
      };

    case "salary":
      return {
        ...base,
        title: "SALARY CERTIFICATE",
        paragraphs: [
          `This is to certify that ${name} is employed with ${company.name} as ${emp.designation}` +
            (emp.department ? ` in the ${emp.department} department` : "") +
            ` since ${formatDate(emp.joiningDate)}.`,
          `${cap(p.he)} currently draws a monthly gross salary of ${formatMoney(emp.salary)}.`,
          `This certificate is issued at the request of the employee for whatever legitimate purpose it may serve. ` +
            `For any verification, please feel free to contact us at ${company.email}.`,
        ],
      };

    default:
      throw new Error("Unknown document type");
  }
}

export function buildRefNumber(typeKey, emp, co) {
  const company = co || companyDefault;
  const type = DOC_TYPES.find((t) => t.key === typeKey);
  const year = new Date().getFullYear();
  const tail = emp.employeeCode ? emp.employeeCode.replace(/\s+/g, "") : emp.id.slice(0, 6).toUpperCase();
  return `${company.refPrefix}/${type.code}/${year}/${tail}`;
}
