import Link from "next/link";
import EmployeeForm from "@/components/EmployeeForm";
import { getDepartments } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewEmployeePage() {
  const departments = await getDepartments();
  return (
    <>
      <Link href="/employees" className="back-link">← All employees</Link>
      <h1 className="page-title">Add employee</h1>
      <p className="page-sub">
        Fill in the details once — every document for this employee will be generated from this profile.
      </p>
      <EmployeeForm departments={departments} />
    </>
  );
}
