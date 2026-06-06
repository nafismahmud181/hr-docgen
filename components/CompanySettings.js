"use client";

import { useRef, useState } from "react";

export default function CompanySettings({ company }) {
  const [name, setName] = useState(company.name || "");
  const [email, setEmail] = useState(company.email || "");
  const [website, setWebsite] = useState(company.website || "");
  const [sigName, setSigName] = useState(company.signatory?.name || "");
  const [sigTitle, setSigTitle] = useState(company.signatory?.title || "");
  const [signature, setSignature] = useState(company.signature || null);
  const [saving, setSaving] = useState(false);
  const [sigBusy, setSigBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const fileRef = useRef(null);

  async function handleSave() {
    setError("");
    setOk("");
    if (!name.trim() || !sigName.trim() || !sigTitle.trim() || !email.trim()) {
      setError("Company name, email, and both signatory fields are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, website, signatory: { name: sigName, title: sigTitle } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save.");
      setOk("Saved. New documents will use these details.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setOk("");
    if (!/^image\/(png|jpe?g)$/.test(file.type)) {
      setError("Use a PNG or JPG image.");
      return;
    }
    if (file.size > 1024 * 1024) {
      setError("Signature image must be under 1 MB.");
      return;
    }
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setSigBusy(true);
    try {
      const res = await fetch("/api/company/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setSignature(data.signature);
      setOk("Signature uploaded.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSigBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeSignature() {
    if (!confirm("Remove the uploaded signature?")) return;
    setError("");
    setOk("");
    const res = await fetch("/api/company/signature", { method: "DELETE" });
    if (!res.ok) {
      setError("Could not remove signature.");
      return;
    }
    setSignature(null);
    setOk("Signature removed.");
  }

  const sigSrc = signature ? `/api/company/signature?v=${signature.updatedAt}` : null;

  return (
    <div className="dash-grid dash-grid-2">
      <section className="card">
        <div className="card-head">
          <h2 className="card-title">Company &amp; signatory</h2>
        </div>
        <p className="muted" style={{ marginBottom: 18 }}>
          These details appear on every generated letter. Email is also used in the letter body
          (“contact us at …”).
        </p>

        <div className="form-grid">
          <div className="field full">
            <label>Company name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Inteliweave" />
          </div>
          <div className="field">
            <label>Company email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. info@inteliweave.com.bd" />
          </div>
          <div className="field">
            <label>Website</label>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="e.g. inteliweave.com.bd" />
          </div>
          <div className="field full">
            <label>Signatory name</label>
            <input value={sigName} onChange={(e) => setSigName(e.target.value)} placeholder="e.g. Authorized Signatory" />
          </div>
          <div className="field full">
            <label>Signatory title</label>
            <input value={sigTitle} onChange={(e) => setSigTitle(e.target.value)} placeholder="e.g. Head of Human Resources" />
          </div>

          <div className="field full">
            <label>Digital signature</label>
            {sigSrc ? (
              <div className="sig-current">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="sig-thumb" src={sigSrc} alt="Current signature" />
                <div className="sig-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()} disabled={sigBusy}>
                    {sigBusy ? "Uploading…" : "Replace"}
                  </button>
                  <button type="button" className="btn btn-danger" onClick={removeSignature} disabled={sigBusy}>
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()} disabled={sigBusy}>
                {sigBusy ? "Uploading…" : "Upload signature image"}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={onFile}
              style={{ display: "none" }}
            />
            <span className="hint">PNG or JPG, under 1 MB. A transparent PNG works best. Appears under “Sincerely,”.</span>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {ok && <div className="alert alert-ok">{ok}</div>}

        <div className="btn-row">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">Preview</h2>
        </div>
        <p className="muted" style={{ marginBottom: 18 }}>Signature block as it appears on letters:</p>
        <div className="letter-preview">
          <div className="lp-closing">Sincerely,</div>
          {sigSrc ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img className="lp-sign-img" src={sigSrc} alt="Signature" />
          ) : (
            <div className="lp-sign-space" />
          )}
          <div className="lp-sign-name">{sigName || "—"}</div>
          <div className="lp-sign-meta">{sigTitle || "—"}</div>
          <div className="lp-sign-meta">{name || "—"}</div>
          {email.trim() && <div className="lp-sign-meta">{email}</div>}
          {website.trim() && <div className="lp-sign-meta">{website}</div>}
        </div>
      </section>
    </div>
  );
}
