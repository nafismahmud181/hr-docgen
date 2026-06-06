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

function DetailPanel({ title, rows, always }) {
  const filled = rows.filter(([, v]) => v);
  if (filled.length === 0 && !always) return null;
  const shown = always ? rows : filled;
  return (
    <div className="panel">
      <h2>{title}</h2>
      <dl className="detail-grid">
        {shown.map(([label, value]) => (
          <div className="detail" key={label}>
            <dt>{label}</dt>
            <dd>{value || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default async function EmployeePage({ params }) {
  const emp = await getEmployee(params.id);
  if (!emp) notFound();
  const [company, templates] = await Promise.all([getCompany(), getTemplates()]);

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
  ];

  const personalBank = [
    ["Account holder", emp.personalAccountHolder],
    ["Account number", emp.personalAccountNumber],
    ["Bank name", emp.personalBankName],
    ["Routing number", emp.personalRoutingNumber],
    ["Branch name", emp.personalBranchName],
    ["Bank city", emp.personalBankCity],
    ["Swift code", emp.personalSwiftCode],
    ["Bank A/C contact", emp.personalBankContact],
  ];

  const payrollBank = [
    ["Account holder", emp.payrollAccountHolder],
    ["Account number", emp.payrollAccountNumber],
  ];

  const status = emp.status || "Present";

  return (
    <>
      <Link href="/employees" className="back-link">← All employees</Link>

      <div className="profile-head">
        <div className="profile-avatar">{initials(emp.name)}</div>
        <div>
          <div className="profile-name">{emp.name}</div>
          <div className="profile-role">
            {emp.designation}
            <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>
          </div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Link href={`/employees/${emp.id}/edit`} className="btn btn-ghost" style={{ textDecoration: "none" }}>
            Edit profile
          </Link>
        </div>
      </div>

      <DetailPanel title="Profile" rows={details} />
      <DetailPanel title="Personal bank account" rows={personalBank} always />
      <DetailPanel title="Payroll bank account" rows={payrollBank} always />

      <DocGenerator employee={emp} company={company} templates={templates} />
    </>
  );
}
