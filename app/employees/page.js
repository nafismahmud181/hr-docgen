import Link from "next/link";
import { getEmployees } from "@/lib/db";
import EmployeeBulkUpload from "@/components/EmployeeBulkUpload";

export const dynamic = "force-dynamic";

function initials(name) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function EmployeesPage() {
  const employees = getEmployees();

  return (
    <>
      <Link href="/" className="back-link">← Dashboard</Link>
      <h1 className="page-title">Employees</h1>
      <p className="page-sub">
        Select an employee to view their profile and generate official documents on the company pad.
      </p>

      <EmployeeBulkUpload />

      {employees.length === 0 ? (
        <div className="empty-state">
          <p>No employees yet.</p>
          <p style={{ marginTop: 8 }}>
            <Link href="/new">Add your first employee →</Link>
          </p>
        </div>
      ) : (
        <div className="emp-grid">
          {employees.map((emp) => (
            <Link key={emp.id} href={`/employees/${emp.id}`} className="emp-card">
              <div className="emp-avatar">{initials(emp.name)}</div>
              <div className="emp-name">{emp.name}</div>
              <div className="emp-meta">
                {emp.designation}
                {emp.department ? ` · ${emp.department}` : ""}
              </div>
              {emp.employeeCode && <div className="emp-meta">ID: {emp.employeeCode}</div>}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
