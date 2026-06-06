"use client";

import { useState } from "react";
import { formatDate } from "@/lib/templates";

export default function SharedLinks({ shares }) {
  const [revoked, setRevoked] = useState(() => new Set());
  const [copiedId, setCopiedId] = useState("");
  const [error, setError] = useState("");

  const visible = shares.filter((s) => !revoked.has(s.id));

  async function copy(id) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/share/${id}`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(""), 2000);
    } catch {
      /* clipboard blocked */
    }
  }

  async function revoke(share) {
    if (!confirm(`Revoke the link for "${share.docLabel}"? The employee will no longer be able to download it.`)) return;
    setError("");
    const res = await fetch(`/api/share/${share.id}`, { method: "DELETE" });
    if (!res.ok) {
      setError(`Could not revoke "${share.docLabel}".`);
      return;
    }
    setRevoked((prev) => new Set(prev).add(share.id));
  }

  return (
    <div className="panel">
      <h2>Shared links</h2>
      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
      {visible.length === 0 ? (
        <p className="muted">No shared links yet. Create one from “Generate a document” below.</p>
      ) : (
        <ul className="share-list">
          {visible.map((s) => (
            <li key={s.id} className="share-row">
              <div className="share-row-info">
                <div className="share-row-title">{s.docLabel}</div>
                <div className="share-row-meta">
                  Created {formatDate(s.createdAt)} · {s.fileName}
                </div>
              </div>
              <div className="share-row-actions">
                <button type="button" className="btn-link" onClick={() => copy(s.id)}>
                  {copiedId === s.id ? "Copied!" : "Copy link"}
                </button>
                <a className="btn-link" href={`/share/${s.id}`} target="_blank" rel="noopener noreferrer">
                  Open
                </a>
                <button type="button" className="btn-link danger" onClick={() => revoke(s)}>
                  Revoke
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
