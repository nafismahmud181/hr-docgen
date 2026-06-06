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
