"use client";

import { useState } from "react";
import TaxonomyManager from "@/components/TaxonomyManager";
import CompanySettings from "@/components/CompanySettings";

const TABS = [
  { key: "taxonomy", label: "Departments & Roles" },
  { key: "signatory", label: "Signatory" },
];

export default function SettingsTabs({ departments, company }) {
  const [tab, setTab] = useState("taxonomy");

  return (
    <>
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`tab${tab === t.key ? " active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "taxonomy" ? (
        <TaxonomyManager departments={departments} />
      ) : (
        <CompanySettings company={company} />
      )}
    </>
  );
}
