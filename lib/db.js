import crypto from "crypto";
import { company as defaultCompany } from "./config";
import { DEFAULT_TEMPLATES } from "./templates";
import { readJson, writeJson, readBinary, writeBinary, deleteBinary } from "./store";

// All functions are async because the underlying store may be remote (Vercel
// Blob in production, local JSON files in development).

const EMPLOYEES = "employees.json";

async function load() {
  return readJson(EMPLOYEES, []);
}

async function save(employees) {
  await writeJson(EMPLOYEES, employees);
}

export async function getEmployees() {
  return (await load()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getEmployee(id) {
  return (await load()).find((e) => e.id === id) || null;
}

export async function createEmployee(data) {
  const employees = await load();
  const employee = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...sanitize(data),
  };
  employees.push(employee);
  await save(employees);
  return employee;
}

export async function createEmployees(rows) {
  const employees = await load();
  const created = [];
  for (const data of rows) {
    const employee = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...sanitize(data),
    };
    employees.push(employee);
    created.push(employee);
  }
  await save(employees);
  return created;
}

export async function updateEmployee(id, data) {
  const employees = await load();
  const idx = employees.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  employees[idx] = { ...employees[idx], ...sanitize(data), id };
  await save(employees);
  return employees[idx];
}

export async function deleteEmployee(id) {
  const employees = await load();
  const next = employees.filter((e) => e.id !== id);
  await save(next);
  return next.length !== employees.length;
}

// ── Departments & Roles ────────────────────────────────────────────────
// Roles are nested inside their department:
//   { id, name, createdAt, roles: [{ id, name, createdAt }] }

const DEPTS = "departments.json";

const byName = (a, b) => a.name.localeCompare(b.name);

async function loadDepts() {
  const list = await readJson(DEPTS, []);
  // Tolerate older/partial records that predate nested roles.
  return list.map((d) => ({ ...d, roles: Array.isArray(d.roles) ? d.roles : [] }));
}

async function saveDepts(list) {
  await writeJson(DEPTS, list);
}

export async function getDepartments() {
  return (await loadDepts())
    .sort(byName)
    .map((d) => ({ ...d, roles: [...d.roles].sort(byName) }));
}

export async function createDepartment(name) {
  const clean = String(name || "").trim();
  if (!clean) return { error: "A name is required." };
  const list = await loadDepts();
  if (list.some((d) => d.name.toLowerCase() === clean.toLowerCase())) {
    return { error: `"${clean}" already exists.` };
  }
  const dept = { id: crypto.randomUUID(), name: clean, createdAt: new Date().toISOString(), roles: [] };
  list.push(dept);
  await saveDepts(list);
  return { item: dept };
}

export async function deleteDepartment(id) {
  const list = await loadDepts();
  const next = list.filter((d) => d.id !== id);
  await saveDepts(next);
  return next.length !== list.length;
}

export async function createRole(departmentId, name) {
  const clean = String(name || "").trim();
  if (!clean) return { error: "A name is required." };
  const list = await loadDepts();
  const dept = list.find((d) => d.id === departmentId);
  if (!dept) return { error: "Department not found." };
  if (dept.roles.some((r) => r.name.toLowerCase() === clean.toLowerCase())) {
    return { error: `"${clean}" already exists in ${dept.name}.` };
  }
  const role = { id: crypto.randomUUID(), name: clean, createdAt: new Date().toISOString() };
  dept.roles.push(role);
  await saveDepts(list);
  return { item: role };
}

export async function deleteRole(departmentId, roleId) {
  const list = await loadDepts();
  const dept = list.find((d) => d.id === departmentId);
  if (!dept) return false;
  const before = dept.roles.length;
  dept.roles = dept.roles.filter((r) => r.id !== roleId);
  await saveDepts(list);
  return dept.roles.length !== before;
}

// ── Company / signatory settings ───────────────────────────────────────

const COMPANY = "company.json";

async function loadCompanyOverrides() {
  return readJson(COMPANY, {});
}

export async function getCompany() {
  const o = await loadCompanyOverrides();
  return {
    ...defaultCompany,
    ...o,
    signatory: { ...defaultCompany.signatory, ...(o.signatory || {}) },
  };
}

export async function saveCompany(data = {}) {
  const o = await loadCompanyOverrides();
  const next = { ...o, signatory: { ...(o.signatory || {}) } };

  if (data.name !== undefined) next.name = String(data.name).trim();
  if (data.email !== undefined) next.email = String(data.email).trim();
  if (data.website !== undefined) next.website = String(data.website).trim();
  if (data.signatory) {
    if (data.signatory.name !== undefined) next.signatory.name = String(data.signatory.name).trim();
    if (data.signatory.title !== undefined) next.signatory.title = String(data.signatory.title).trim();
  }

  await writeJson(COMPANY, next);
  return getCompany();
}

// ── Digital signature image ────────────────────────────────────────────
// Bytes stored separately; mime + timestamp kept in company.json.

const SIG = "signature-image";

export async function saveSignature(dataUrl) {
  const m = /^data:(image\/(?:png|jpe?g));base64,(.+)$/i.exec(dataUrl || "");
  if (!m) return { error: "Please upload a PNG or JPG image." };
  const mime = m[1].toLowerCase() === "image/jpg" ? "image/jpeg" : m[1].toLowerCase();
  const bytes = Buffer.from(m[2], "base64");

  await writeBinary(SIG, bytes, mime);

  const o = await loadCompanyOverrides();
  o.signature = { mime, updatedAt: new Date().toISOString() };
  await writeJson(COMPANY, o);
  return { company: await getCompany() };
}

export async function deleteSignature() {
  await deleteBinary(SIG);
  const o = await loadCompanyOverrides();
  delete o.signature;
  await writeJson(COMPANY, o);
  return getCompany();
}

export async function getSignatureImage() {
  const o = await loadCompanyOverrides();
  if (!o.signature) return null;
  const bytes = await readBinary(SIG);
  if (!bytes) return null;
  return { bytes, mime: o.signature.mime };
}

// ── Document templates ─────────────────────────────────────────────────

const TEMPLATES = "templates.json";

async function loadTemplateOverrides() {
  return readJson(TEMPLATES, {});
}

function mergeTemplate(key, overrides) {
  const def = DEFAULT_TEMPLATES[key];
  if (!def) return null;
  const o = overrides[key];
  if (!o) {
    return { ...def, paragraphs: [...def.paragraphs], customized: false };
  }
  return {
    title: o.title ?? def.title,
    addressee: o.addressee ?? def.addressee,
    paragraphs: Array.isArray(o.paragraphs) ? [...o.paragraphs] : [...def.paragraphs],
    closing: o.closing ?? def.closing,
    customized: true,
  };
}

export async function getTemplates() {
  const o = await loadTemplateOverrides();
  const out = {};
  for (const key of Object.keys(DEFAULT_TEMPLATES)) out[key] = mergeTemplate(key, o);
  return out;
}

export async function getTemplate(key) {
  return mergeTemplate(key, await loadTemplateOverrides());
}

export async function saveTemplate(key, data = {}) {
  if (!DEFAULT_TEMPLATES[key]) return { error: "Unknown template." };
  const o = await loadTemplateOverrides();
  const next = { ...(o[key] || {}) };
  if (data.title !== undefined) next.title = String(data.title);
  if (data.addressee !== undefined) next.addressee = String(data.addressee);
  if (data.closing !== undefined) next.closing = String(data.closing);
  if (Array.isArray(data.paragraphs)) {
    next.paragraphs = data.paragraphs.map((p) => String(p)).filter((p) => p.trim());
  }
  o[key] = next;
  await writeJson(TEMPLATES, o);
  return { template: await getTemplate(key) };
}

export async function resetTemplate(key) {
  const o = await loadTemplateOverrides();
  delete o[key];
  await writeJson(TEMPLATES, o);
  return getTemplate(key);
}

function sanitize(data) {
  const fields = [
    "name",
    "gender",
    "employeeCode",
    "designation",
    "department",
    "joiningDate",
    "lastWorkingDate",
    "salary",
    "email",
    "phone",
    "address",
    "employmentType",
    "status",
    // Personal bank account
    "personalAccountHolder",
    "personalAccountNumber",
    "personalBankName",
    "personalRoutingNumber",
    "personalBranchName",
    "personalBankCity",
    "personalSwiftCode",
    "personalBankContact",
    // Payroll bank account
    "payrollAccountHolder",
    "payrollAccountNumber",
  ];
  const out = {};
  for (const f of fields) {
    if (data[f] !== undefined) out[f] = String(data[f]).trim();
  }
  return out;
}
