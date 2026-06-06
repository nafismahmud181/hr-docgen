"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DOC_TYPES = [
  { key: "experience", label: "Experience Letter", code: "EXP" },
  { key: "loe", label: "Letter of Employment", code: "LOE" },
  { key: "noc", label: "No Objection Certificate", code: "NOC", hasPurpose: true },
  { key: "salary", label: "Salary Certificate", code: "SAL" },
];

export default function DocGenerator({ employee }) {
  const router = useRouter();
  const [selected, setSelected] = useState("loe");
  const [purpose, setPurpose] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const type = DOC_TYPES.find((t) => t.key === selected);

  async function handleGenerate() {
    setError("");
    setOk("");
    setBusy(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employee.id,
          docType: selected,
          purpose,
          issueDate,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate document.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName = employee.name.replace(/[^a-z0-9]+/gi, "_");
      a.href = url;
      a.download = `${type.code}_${safeName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setOk(`${type.label} generated and downloaded.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete ${employee.name}? This cannot be undone.`)) return;
    await fetch(`/api/employees/${employee.id}`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <div className="panel">
        <h2>Generate a document</h2>

        <div className="doc-options">
          {DOC_TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`doc-option ${selected === t.key ? "selected" : ""}`}
              onClick={() => setSelected(t.key)}
            >
              <div className="doc-title">{t.label}</div>
              <div className="doc-code">{t.code}</div>
            </button>
          ))}
        </div>

        <div className="form-grid">
          <div className="field">
            <label>Issue date</label>
            <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>
          {type?.hasPurpose && (
            <div className="field full">
              <label>Purpose (for NOC)</label>
              <input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder='e.g. "traveling to Singapore for a personal visit from 10–20 July 2026"'
              />
              <span className="hint">
                Completes the sentence: “{`Inteliweave has no objection to ${employee.name} …`}”
              </span>
            </div>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {ok && <div className="alert alert-ok">{ok}</div>}

        <div className="btn-row">
          <button className="btn btn-primary" onClick={handleGenerate} disabled={busy}>
            {busy ? "Generating…" : "Generate PDF"}
          </button>
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-danger" onClick={handleDelete}>
          Delete employee
        </button>
      </div>
    </>
  );
}
