import Link from "next/link";
import { getTemplates } from "@/lib/db";
import { DOC_TYPES } from "@/lib/templates";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templates = await getTemplates();

  return (
    <>
      <Link href="/" className="back-link">← Dashboard</Link>
      <h1 className="page-title">Templates</h1>
      <p className="page-sub">
        Every letter type in the system. Open one to edit its wording and preview it on your office pad.
      </p>

      <div className="dept-grid">
        {DOC_TYPES.map((t) => {
          const tpl = templates[t.key];
          return (
            <Link key={t.key} href={`/templates/${t.key}`} className="tile-card">
              <div className="tpl-card-top">
                <span className="doctype-code">{t.code}</span>
                {tpl?.customized && <span className="oneoff-badge">Customized</span>}
              </div>
              <div className="tile-title" style={{ marginTop: 12 }}>{t.label}</div>
              <div className="tile-desc">{tpl?.title}</div>
              <div className="tile-cta">Edit &amp; preview →</div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
