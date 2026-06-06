import Link from "next/link";
import { getDepartments, getCompany } from "@/lib/db";
import SettingsTabs from "@/components/SettingsTabs";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const departments = getDepartments();
  const company = getCompany();

  return (
    <>
      <Link href="/" className="back-link">← Dashboard</Link>
      <h1 className="page-title">Settings</h1>
      <p className="page-sub">
        Manage departments and roles, and the signatory shown on generated documents.
      </p>

      <SettingsTabs departments={departments} company={company} />
    </>
  );
}
