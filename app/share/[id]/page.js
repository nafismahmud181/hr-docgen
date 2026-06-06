import { getShare } from "@/lib/db";
import { formatDate } from "@/lib/templates";

export const dynamic = "force-dynamic";

export default async function SharePage({ params }) {
  const share = await getShare(params.id);

  if (!share) {
    return (
      <div className="share-wrap">
        <div className="share-card">
          <div className="brand-mark">IW</div>
          <h1 className="share-title">Link unavailable</h1>
          <p className="share-sub">This download link is invalid or has been revoked.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="share-wrap">
      <div className="share-card">
        <div className="brand-mark">IW</div>
        <div className="share-kicker">Inteliweave · HR Document</div>
        <h1 className="share-title">{share.docLabel}</h1>
        <p className="share-sub">Prepared for {share.employeeName}</p>
        {share.issueDate && <p className="share-meta">Issued {formatDate(share.issueDate)}</p>}
        <a className="btn btn-primary share-download" href={`/api/share/${share.id}`}>
          Download PDF
        </a>
        <p className="share-note">{share.fileName}</p>
      </div>
    </div>
  );
}
