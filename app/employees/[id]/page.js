import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployee, getCompany, getTemplates } from "@/lib/db";
import DocGenerator from "@/components/DocGenerator";
import { formatDate, formatMoney } from "@/lib/templates";

export const dynamic = "force-dynamic";

function initials(name) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function EmployeePage({ params }) {
  const emp = getEmployee(params.id);
  if (!emp) notFound();
  const company = getCompany();
  const templates = getTemplates();

  const details = [
    ["Employee ID", emp.employeeCode],
    ["Department", emp.department],
    ["Employment type", emp.employmentType],
    ["Joining date", formatDate(emp.joiningDate)],
    ["Last working date", formatDate(emp.lastWorkingDate)],
    ["Monthly gross salary", formatMoney(emp.salary)],
    ["Email", emp.email],
    ["Phone", emp.phone],
    ["Address", emp.address],
  ].filter(([, v]) => v);

  return (
    <>
      <Link href="/employees" className="back-link">← All employees</Link>

      <div className="profile-head">
        <div className="profile-avatar">{initials(emp.name)}</div>
        <div>
          <div className="profile-name">{emp.name}</div>
          <div className="profile-role">{emp.designation}</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Link href={`/employees/${emp.id}/edit`} className="btn btn-ghost" style={{ textDecoration: "none" }}>
            Edit profile
          </Link>
        </div>
      </div>

      <div className="panel">
        <h2>Profile</h2>
        <dl className="detail-grid">
          {details.map(([label, value]) => (
            <div className="detail" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <DocGenerator employee={emp} company={company} templates={templates} />
    </>
  );
}
