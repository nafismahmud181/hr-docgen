"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PLACEHOLDERS } from "@/lib/templates";

export default function TemplateEditor({ docKey, label, code, hasPurpose, template }) {
  const [title, setTitle] = useState(template.title);
  const [addressee, setAddressee] = useState(template.addressee);
  const [paragraphs, setParagraphs] = useState(template.paragraphs);
  const [closing, setClosing] = useState(template.closing);
  const [customized, setCustomized] = useState(Boolean(template.customized));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const [previewUrl, setPreviewUrl] = useState("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const urlRef = useRef("");

  const current = useCallback(
    () => ({ title, addressee, paragraphs, closing }),
    [title, addressee, paragraphs, closing]
  );

  const refreshPreview = useCallback(async () => {
    setPreviewBusy(true);
    setPreviewError("");
    try {
      const res = await fetch("/api/templates/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType: docKey, template: current() }),
      });
      if (!res.ok) throw new Error("Preview failed.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;
      setPreviewUrl(url);
    } catch (err) {
      setPreviewError(err.message);
    } finally {
      setPreviewBusy(false);
    }
  }, [docKey, current]);

  // Initial preview on mount; revoke the blob URL on unmount.
  useEffect(() => {
    refreshPreview();
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Insert a placeholder at the caret of the focused input/textarea.
  function insertToken(token) {
    const el = document.activeElement;
    const tag = el?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") {
      document.execCommand("insertText", false, token);
    } else {
      setError("Click inside a field first, then insert a placeholder.");
    }
  }

  const patchPara = (i, v) => setParagraphs((arr) => arr.map((p, j) => (j === i ? v : p)));
  const addPara = () => setParagraphs((arr) => [...arr, ""]);
  const removePara = (i) => setParagraphs((arr) => arr.filter((_, j) => j !== i));

  async function save() {
    setError("");
    setOk("");
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/templates/${docKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save.");
      setCustomized(true);
      setOk("Template saved. New documents of this type will use it.");
      refreshPreview();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    if (!confirm("Reset this template to the original default wording?")) return;
    setError("");
    setOk("");
    const res = await fetch(`/api/templates/${docKey}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to reset.");
      return;
    }
    setTitle(data.title);
    setAddressee(data.addressee);
    setParagraphs(data.paragraphs);
    setClosing(data.closing);
    setCustomized(false);
    setOk("Reset to default.");
    // refresh with the restored values
    setTimeout(refreshPreview, 0);
  }

  return (
    <div className="tpl-layout">
      <div className="card">
        <div className="card-head">
          <h2 className="card-title">
            Wording <span className="doctype-code">{code}</span>
            {customized && <span className="oneoff-badge" style={{ marginLeft: 8 }}>Customized</span>}
          </h2>
        </div>

        <div className="palette">
          <span className="palette-label">Insert:</span>
          {PLACEHOLDERS.map((p) => (
            <button
              key={p.token}
              type="button"
              className="chip"
              title={p.label}
              onMouseDown={(e) => {
                e.preventDefault();
                insertToken(p.token);
              }}
            >
              {p.token}
            </button>
          ))}
        </div>

        <div className="field full">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field full" style={{ marginTop: 14 }}>
          <label>Addressee</label>
          <input value={addressee} onChange={(e) => setAddressee(e.target.value)} />
        </div>

        <div className="field full" style={{ marginTop: 14 }}>
          <label>Body paragraphs</label>
          <div className="lp-edit-paras">
            {paragraphs.map((p, i) => (
              <div className="para-edit-row" key={i}>
                <textarea className="lp-edit-area" rows={3} value={p} onChange={(e) => patchPara(i, e.target.value)} />
                {paragraphs.length > 1 && (
                  <button type="button" className="para-remove" title="Remove paragraph" onClick={() => removePara(i)}>
                    ×
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn-link" onClick={addPara}>+ Add paragraph</button>
          </div>
        </div>

        <div className="field full" style={{ marginTop: 14 }}>
          <label>Closing</label>
          <input value={closing} onChange={(e) => setClosing(e.target.value)} />
        </div>

        {hasPurpose && (
          <p className="hint" style={{ marginTop: 12 }}>
            The preview fills <code>{"{{purpose}}"}</code> with a sample purpose. The real purpose is entered when generating an NOC.
          </p>
        )}

        {error && <div className="alert alert-error">{error}</div>}
        {ok && <div className="alert alert-ok">{ok}</div>}

        <div className="btn-row">
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save template"}
          </button>
          <button className="btn btn-ghost" onClick={reset}>Reset to default</button>
        </div>
      </div>

      <div className="card tpl-preview-card">
        <div className="card-head">
          <h2 className="card-title">Preview on office pad</h2>
          <button type="button" className="btn-link" onClick={refreshPreview} disabled={previewBusy}>
            {previewBusy ? "Rendering…" : "↻ Update preview"}
          </button>
        </div>
        {previewError ? (
          <div className="alert alert-error">{previewError}</div>
        ) : previewUrl ? (
          <iframe className="tpl-preview-frame" src={previewUrl} title="Template preview" />
        ) : (
          <p className="muted">Rendering preview…</p>
        )}
        <p className="hint" style={{ marginTop: 10 }}>
          Rendered with sample employee details on <code>PAD_Template.pdf</code>.
        </p>
      </div>
    </div>
  );
}
