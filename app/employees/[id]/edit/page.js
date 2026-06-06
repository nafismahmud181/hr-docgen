import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployee } from "@/lib/db";
import EmployeeForm from "@/components/EmployeeForm";

export const dynamic = "force-dynamic";

export default function EditEmployeePage({ params }) {
  const emp = getEmployee(params.id);
  if (!emp) notFound();

  return (
    <>
      <Link href={`/employees/${emp.id}`} className="back-link">← Back to profile</Link>
      <h1 className="page-title">Edit employee</h1>
      <p className="page-sub">Update {emp.name}&apos;s details. Changes apply to all future documents.</p>
      <EmployeeForm employee={emp} />
    </>
  );
}
