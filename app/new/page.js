import Link from "next/link";
import EmployeeForm from "@/components/EmployeeForm";

export default function NewEmployeePage() {
  return (
    <>
      <Link href="/employees" className="back-link">← All employees</Link>
      <h1 className="page-title">Add employee</h1>
      <p className="page-sub">
        Fill in the details once — every document for this employee will be generated from this profile.
      </p>
      <EmployeeForm />
    </>
  );
}
