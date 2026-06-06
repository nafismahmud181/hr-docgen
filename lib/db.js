import fs from "fs";
import path from "path";
import crypto from "crypto";
import { company as defaultCompany } from "./config";
import { DEFAULT_TEMPLATES } from "./templates";

const DATA_FILE = path.join(process.cwd(), "data", "employees.json");

function load() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function save(employees) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(employees, null, 2), "utf-8");
}

export function getEmployees() {
  return load().sort((a, b) => a.name.localeCompare(b.name));
}

export function getEmployee(id) {
  return load().find((e) => e.id === id) || null;
}

export function createEmployee(data) {
  const employees = load();
  const employee = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...sanitize(data),
  };
  employees.push(employee);
  save(employees);
  return employee;
}

export function updateEmployee(id, data) {
  const employees = load();
  const idx = employees.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  employees[idx] = { ...employees[idx], ...sanitize(data), id };
  save(employees);
  return employees[idx];
}

export function deleteEmployee(id) {
  const employees = load();
  const next = employees.filter((e) => e.id !== id);
  save(next);
  return next.length !== employees.length;
}

// ── Departments & Roles ────────────────────────────────────────────────
// Same plain-JSON approach as employees: one file, no database. Roles are
// nested inside their department, e.g.
//   { id, name, createdAt, roles: [{ id, name, createdAt }] }

const DEPTS_FILE = path.join(process.cwd(), "data", "departments.json");

const byName = (a, b) => a.name.localeCompare(b.name);

function loadDepts() {
  let list;
  try {
    list = JSON.parse(fs.readFileSync(DEPTS_FILE, "utf-8"));
  } catch {
    return [];
  }
  // Tolerate older/partial records that predate nested roles.
  return list.map((d) => ({ ...d, roles: Array.isArray(d.roles) ? d.roles : [] }));
}

function saveDepts(list) {
  fs.mkdirSync(path.dirname(DEPTS_FILE), { recursive: true });
  fs.writeFileSync(DEPTS_FILE, JSON.stringify(list, null, 2), "utf-8");
}

export function getDepartments() {
  return loadDepts()
    .sort(byName)
    .map((d) => ({ ...d, roles: [...d.roles].sort(byName) }));
}

export function createDepartment(name) {
  const clean = String(name || "").trim();
  if (!clean) return { error: "A name is required." };
  const list = loadDepts();
  if (list.some((d) => d.name.toLowerCase() === clean.toLowerCase())) {
    return { error: `"${clean}" already exists.` };
  }
  const dept = { id: crypto.randomUUID(), name: clean, createdAt: new Date().toISOString(), roles: [] };
  list.push(dept);
  saveDepts(list);
  return { item: dept };
}

export function deleteDepartment(id) {
  const list = loadDepts();
  const next = list.filter((d) => d.id !== id);
  saveDepts(next);
  return next.length !== list.length;
}

export function createRole(departmentId, name) {
  const clean = String(name || "").trim();
  if (!clean) return { error: "A name is required." };
  const list = loadDepts();
  const dept = list.find((d) => d.id === departmentId);
  if (!dept) return { error: "Department not found." };
  if (dept.roles.some((r) => r.name.toLowerCase() === clean.toLowerCase())) {
    return { error: `"${clean}" already exists in ${dept.name}.` };
  }
  const role = { id: crypto.randomUUID(), name: clean, createdAt: new Date().toISOString() };
  dept.roles.push(role);
  saveDepts(list);
  return { item: role };
}

export function deleteRole(departmentId, roleId) {
  const list = loadDepts();
  const dept = list.find((d) => d.id === departmentId);
  if (!dept) return false;
  const before = dept.roles.length;
  dept.roles = dept.roles.filter((r) => r.id !== roleId);
  saveDepts(list);
  return dept.roles.length !== before;
}

// ── Company / signatory settings ───────────────────────────────────────
// Editable overrides are stored here and merged over the static defaults in
// lib/config.js. Anything not overridden falls back to the default.

const COMPANY_FILE = path.join(process.cwd(), "data", "company.json");

function loadCompanyOverrides() {
  try {
    return JSON.parse(fs.readFileSync(COMPANY_FILE, "utf-8"));
  } catch {
    return {};
  }
}

export function getCompany() {
  const o = loadCompanyOverrides();
  return {
    ...defaultCompany,
    ...o,
    signatory: { ...defaultCompany.signatory, ...(o.signatory || {}) },
  };
}

export function saveCompany(data = {}) {
  const o = loadCompanyOverrides();
  const next = { ...o, signatory: { ...(o.signatory || {}) } };

  if (data.name !== undefined) next.name = String(data.name).trim();
  if (data.email !== undefined) next.email = String(data.email).trim();
  if (data.website !== undefined) next.website = String(data.website).trim();
  if (data.signatory) {
    if (data.signatory.name !== undefined) next.signatory.name = String(data.signatory.name).trim();
    if (data.signatory.title !== undefined) next.signatory.title = String(data.signatory.title).trim();
  }

  fs.mkdirSync(path.dirname(COMPANY_FILE), { recursive: true });
  fs.writeFileSync(COMPANY_FILE, JSON.stringify(next, null, 2), "utf-8");
  return getCompany();
}

// ── Digital signature image ────────────────────────────────────────────
// The raw image bytes live in a sidecar file; only its mime + timestamp are
// kept in company.json (so getCompany() stays small).

const SIG_FILE = path.join(process.cwd(), "data", "signature-image");

export function saveSignature(dataUrl) {
  const m = /^data:(image\/(?:png|jpe?g));base64,(.+)$/i.exec(dataUrl || "");
  if (!m) return { error: "Please upload a PNG or JPG image." };
  const mime = m[1].toLowerCase() === "image/jpg" ? "image/jpeg" : m[1].toLowerCase();
  const bytes = Buffer.from(m[2], "base64");

  fs.mkdirSync(path.dirname(SIG_FILE), { recursive: true });
  fs.writeFileSync(SIG_FILE, bytes);

  const o = loadCompanyOverrides();
  o.signature = { mime, updatedAt: new Date().toISOString() };
  fs.writeFileSync(COMPANY_FILE, JSON.stringify(o, null, 2), "utf-8");
  return { company: getCompany() };
}

export function deleteSignature() {
  try {
    fs.unlinkSync(SIG_FILE);
  } catch {
    /* already gone */
  }
  const o = loadCompanyOverrides();
  delete o.signature;
  fs.writeFileSync(COMPANY_FILE, JSON.stringify(o, null, 2), "utf-8");
  return getCompany();
}

export function getSignatureImage() {
  const o = loadCompanyOverrides();
  if (!o.signature) return null;
  try {
    return { bytes: fs.readFileSync(SIG_FILE), mime: o.signature.mime };
  } catch {
    return null;
  }
}

// ── Document templates ─────────────────────────────────────────────────
// Overrides are merged over the defaults in lib/templates.js. Only edited
// fields are stored; anything else falls back to the default wording.

const TEMPLATES_FILE = path.join(process.cwd(), "data", "templates.json");

function loadTemplateOverrides() {
  try {
    return JSON.parse(fs.readFileSync(TEMPLATES_FILE, "utf-8"));
  } catch {
    return {};
  }
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

export function getTemplates() {
  const o = loadTemplateOverrides();
  const out = {};
  for (const key of Object.keys(DEFAULT_TEMPLATES)) out[key] = mergeTemplate(key, o);
  return out;
}

export function getTemplate(key) {
  return mergeTemplate(key, loadTemplateOverrides());
}

export function saveTemplate(key, data = {}) {
  if (!DEFAULT_TEMPLATES[key]) return { error: "Unknown template." };
  const o = loadTemplateOverrides();
  const next = { ...(o[key] || {}) };
  if (data.title !== undefined) next.title = String(data.title);
  if (data.addressee !== undefined) next.addressee = String(data.addressee);
  if (data.closing !== undefined) next.closing = String(data.closing);
  if (Array.isArray(data.paragraphs)) {
    next.paragraphs = data.paragraphs.map((p) => String(p)).filter((p) => p.trim());
  }
  o[key] = next;
  fs.mkdirSync(path.dirname(TEMPLATES_FILE), { recursive: true });
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(o, null, 2), "utf-8");
  return { template: getTemplate(key) };
}

export function resetTemplate(key) {
  const o = loadTemplateOverrides();
  delete o[key];
  fs.mkdirSync(path.dirname(TEMPLATES_FILE), { recursive: true });
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(o, null, 2), "utf-8");
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
  ];
  const out = {};
  for (const f of fields) {
    if (data[f] !== undefined) out[f] = String(data[f]).trim();
  }
  return out;
}
