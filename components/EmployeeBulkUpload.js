"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function EmployeeBulkUpload() {
  const router = useRouter();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setResult(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/employees/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed.");
      setResult(data);
      router.refresh(); // show the newly added employees
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="panel upload-panel">
      <div className="upload-copy">
        <h2 style={{ border: "none", padding: 0, marginBottom: 4 }}>Bulk upload</h2>
        <p className="hint">
          Add many employees at once from an Excel file. Download the template, fill one row per
          employee, then upload. <strong>Name</strong> and <strong>Designation</strong> are required.
        </p>
      </div>
      <div className="btn-row" style={{ marginTop: 0 }}>
        <a className="btn btn-ghost" href="/api/employees/template">Download template</a>
        <button className="btn btn-primary" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? "Importing…" : "Upload Excel"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={onUpload}
          style={{ display: "none" }}
        />
      </div>

      {error && <div className="alert alert-error" style={{ flexBasis: "100%" }}>{error}</div>}
      {result && (
        <div className="alert alert-ok" style={{ flexBasis: "100%" }}>
          Added {result.created} employee{result.created === 1 ? "" : "s"}
          {result.skipped ? `, skipped ${result.skipped}` : ""}.
          {result.errors?.length > 0 && (
            <div style={{ marginTop: 6, fontSize: 13 }}>
              {result.errors.slice(0, 10).map((e) => `Row ${e.row}: ${e.reason}`).join(" · ")}
              {result.errors.length > 10 ? " …" : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
