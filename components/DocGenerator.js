"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buildDocument, buildRefNumber, formatDate, DOC_TYPES } from "@/lib/templates";
import { company } from "@/lib/config";

export default function DocGenerator({ employee }) {
  const router = useRouter();
  const [selected, setSelected] = useState("loe");
  const [purpose, setPurpose] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  // null  → preview follows the template live.
  // object → a one-off edited copy ({ title, addressee, paragraphs, closing }).
  const [edited, setEdited] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const type = DOC_TYPES.find((t) => t.key === selected);
  const editing = edited !== null;

  // The wording is built from the very same template the PDF uses, so the
  // preview matches the generated document exactly.
  const autoDoc = useMemo(() => {
    try {
      return buildDocument(selected, employee, { purpose });
    } catch {
      return null;
    }
  }, [selected, employee, purpose]);

  const refNo = useMemo(() => buildRefNumber(selected, employee), [selected, employee]);

  // What the preview shows: the edited copy if present, else the live template.
  const doc = edited || autoDoc;

  function chooseType(key) {
    if (editing && !confirm("Discard your edited text and switch document type?")) return;
    setEdited(null);
    setSelected(key);
    setOk("");
    setError("");
  }

  function startEdit() {
    if (!autoDoc) return;
    setEdited({
      title: autoDoc.title,
      addressee: autoDoc.addressee,
      paragraphs: [...autoDoc.paragraphs],
      closing: autoDoc.closing,
    });
  }

  function resetEdit() {
    setEdited(null);
  }

  const patch = (key, value) => setEdited((d) => ({ ...d, [key]: value }));
  const patchPara = (i, value) =>
    setEdited((d) => ({ ...d, paragraphs: d.paragraphs.map((p, j) => (j === i ? value : p)) }));
  const addPara = () => setEdited((d) => ({ ...d, paragraphs: [...d.paragraphs, ""] }));
  const removePara = (i) =>
    setEdited((d) => ({ ...d, paragraphs: d.paragraphs.filter((_, j) => j !== i) }));

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
          override: editing
            ? {
                title: edited.title,
                addressee: edited.addressee,
                paragraphs: edited.paragraphs,
                closing: edited.closing,
              }
            : undefined,
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
      setOk(`${type.label} generated and downloaded${editing ? " (with edited text)" : ""}.`);
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
              onClick={() => chooseType(t.key)}
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
          {type?.hasPurpose && !editing && (
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

        {/* ── Live preview ── */}
        <div className="preview-toolbar">
          <div className="preview-toolbar-label">
            Live preview
            {editing && <span className="oneoff-badge">One-off edit</span>}
          </div>
          {editing ? (
            <button type="button" className="btn-link" onClick={resetEdit}>
              ↺ Reset to template
            </button>
          ) : (
            <button type="button" className="btn-link" onClick={startEdit} disabled={!autoDoc}>
              ✎ Edit text
            </button>
          )}
        </div>

        {editing && (
          <p className="hint" style={{ marginBottom: 12 }}>
            Editing the wording for this document only. The saved template is not changed.
          </p>
        )}

        {!doc ? (
          <div className="alert alert-error">This document type can’t be previewed for this employee.</div>
        ) : (
          <article className="letter-preview">
            <div className="lp-head">
              <span>Ref: {refNo}</span>
              <span>Date: {formatDate(issueDate)}</span>
            </div>

            {editing ? (
              <input className="lp-edit-title" value={doc.title} onChange={(e) => patch("title", e.target.value)} />
            ) : (
              <div className="lp-title">{doc.title}</div>
            )}

            {editing ? (
              <input
                className="lp-edit-input"
                value={doc.addressee}
                onChange={(e) => patch("addressee", e.target.value)}
              />
            ) : (
              doc.addressee && <div className="lp-addressee">{doc.addressee}</div>
            )}

            {editing ? (
              <div className="lp-edit-paras">
                {doc.paragraphs.map((p, i) => (
                  <div className="para-edit-row" key={i}>
                    <textarea
                      className="lp-edit-area"
                      rows={3}
                      value={p}
                      onChange={(e) => patchPara(i, e.target.value)}
                    />
                    {doc.paragraphs.length > 1 && (
                      <button
                        type="button"
                        className="para-remove"
                        title="Remove paragraph"
                        onClick={() => removePara(i)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-link" onClick={addPara}>
                  + Add paragraph
                </button>
              </div>
            ) : (
              doc.paragraphs.map((p, i) => (
                <p className="lp-para" key={i}>
                  {p}
                </p>
              ))
            )}

            <div className="lp-sign">
              {editing ? (
                <input className="lp-edit-input" value={doc.closing} onChange={(e) => patch("closing", e.target.value)} />
              ) : (
                <div className="lp-closing">{doc.closing}</div>
              )}
              <div className="lp-sign-space" />
              <div className="lp-sign-name">{company.signatory.name}</div>
              <div className="lp-sign-meta">{company.signatory.title}</div>
              <div className="lp-sign-meta">{company.name}</div>
            </div>
          </article>
        )}

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
