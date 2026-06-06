import Link from "next/link";
import { getDepartments } from "@/lib/db";
import TaxonomyManager from "@/components/TaxonomyManager";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const departments = getDepartments();

  return (
    <>
      <Link href="/" className="back-link">← Dashboard</Link>
      <h1 className="page-title">Departments &amp; Roles</h1>
      <p className="page-sub">
        Add departments, then add the roles that belong to each one.
      </p>

      <TaxonomyManager departments={departments} />
    </>
  );
}
