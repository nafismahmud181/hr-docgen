import fs from "fs";
import path from "path";
import crypto from "crypto";

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
