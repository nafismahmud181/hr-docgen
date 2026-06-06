import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplate } from "@/lib/db";
import { DOC_TYPES } from "@/lib/templates";
import TemplateEditor from "@/components/TemplateEditor";

export const dynamic = "force-dynamic";

export default function TemplateEditPage({ params }) {
  const type = DOC_TYPES.find((t) => t.key === params.key);
  if (!type) notFound();
  const template = getTemplate(params.key);

  return (
    <>
      <Link href="/templates" className="back-link">← All templates</Link>
      <h1 className="page-title">{type.label}</h1>
      <p className="page-sub">
        Edit the wording and see it rendered on your office pad with sample employee details.
      </p>

      <TemplateEditor
        docKey={type.key}
        label={type.label}
        code={type.code}
        hasPurpose={Boolean(type.hasPurpose)}
        template={template}
      />
    </>
  );
}
