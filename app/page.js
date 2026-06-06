import Link from "next/link";
import { getEmployees } from "@/lib/db";
import { DOC_TYPES, formatDate } from "@/lib/templates";

export const dynamic = "force-dynamic";

// Segment colors for the donut charts / legends.
const PALETTE = ["#2f6fed", "#1f9d6b", "#e0a23b", "#7c5cff", "#2bb3c0", "#d6604d", "#c64f9b"];

function initials(name) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Count occurrences of a field into [{ label, value }] sorted desc.
function breakdown(employees, field, fallback) {
  const counts = {};
  for (const e of employees) {
    const key = (e[field] || "").trim() || fallback;
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

// Build a conic-gradient string + attach a color to each segment.
function donut(segments) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const colored = segments.map((seg, i) => {
    const color = PALETTE[i % PALETTE.length];
    const start = (acc / total) * 100;
    acc += seg.value;
    const end = (acc / total) * 100;
    return { ...seg, color, start, end };
  });
  const stops = colored.map((s) => `${s.color} ${s.start}% ${s.end}%`).join(", ");
  return { gradient: `conic-gradient(${stops})`, colored };
}

function greeting(date) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function DonutCard({ title, segments, centerLabel }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const { gradient, colored } = donut(segments);

  return (
    <section className="card chart-card">
      <div className="card-head">
        <h2 className="card-title">{title}</h2>
      </div>
      {total === 0 ? (
        <p className="muted">No data yet.</p>
      ) : (
        <div className="chart-body">
          <div className="donut" style={{ background: gradient }}>
            <div className="donut-hole">
              <div className="donut-value">{total}</div>
              <div className="donut-cap">{centerLabel}</div>
            </div>
          </div>
          <ul className="legend">
            {colored.map((s) => (
              <li key={s.label}>
                <span className="legend-dot" style={{ background: s.color }} />
                <span className="legend-label">{s.label}</span>
                <span className="legend-value">{s.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const employees = getEmployees();
  const now = new Date();

  const departments = breakdown(employees, "department", "Unassigned");
  const employmentTypes = breakdown(employees, "employmentType", "Unspecified");

  // Hires within the last 30 days (honest, derived from joiningDate).
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const recentHires = employees.filter((e) => {
    if (!e.joiningDate) return false;
    const d = new Date(e.joiningDate);
    return !isNaN(d) && now - d <= THIRTY_DAYS && now - d >= 0;
  }).length;

  const stats = [
    { label: "Total employees", value: employees.length },
    { label: "Departments", value: departments.length },
    { label: "Document types", value: DOC_TYPES.length },
    { label: "New hires · 30d", value: recentHires },
  ];

  // Most recently added profiles.
  const recent = [...employees]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  const quickActions = [
    { href: "/new", title: "Add employee", desc: "Create a new staff profile", icon: "＋" },
    { href: "/employees", title: "Browse employees", desc: "View profiles & generate letters", icon: "☰" },
  ];

  return (
    <>
      <header className="dash-head">
        <div>
          <h1 className="dash-greeting">{greeting(now)}, HR team</h1>
          <p className="dash-sub">
            {employees.length > 0
              ? `You're managing ${employees.length} employee${employees.length === 1 ? "" : "s"} across ${departments.length} department${departments.length === 1 ? "" : "s"}.`
              : "Add your first employee to start generating documents."}
          </p>
        </div>
        <div className="date-card">
          <div className="date-cap">Today</div>
          <div className="date-value">{formatDate(now)}</div>
        </div>
      </header>

      <div className="stat-row">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <DonutCard title="Workforce by department" segments={departments} centerLabel="Total" />
        <DonutCard title="Employment type" segments={employmentTypes} centerLabel="Staff" />

        <section className="card actions-card">
          <div className="card-head">
            <h2 className="card-title">Quick actions</h2>
          </div>
          <div className="action-list">
            {quickActions.map((a) => (
              <Link key={a.href} href={a.href} className="action-row">
                <span className="action-icon">{a.icon}</span>
                <span className="action-text">
                  <span className="action-title">{a.title}</span>
                  <span className="action-desc">{a.desc}</span>
                </span>
                <span className="action-arrow">→</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="dash-grid dash-grid-2">
        <section className="card list-card">
          <div className="card-head">
            <h2 className="card-title">Recent employees</h2>
            <Link href="/employees" className="card-link">View all</Link>
          </div>
          {recent.length === 0 ? (
            <p className="muted">No employees yet. <Link href="/new">Add one →</Link></p>
          ) : (
            <ul className="recent-list">
              {recent.map((e) => (
                <li key={e.id}>
                  <Link href={`/employees/${e.id}`} className="recent-row">
                    <span className="recent-avatar">{initials(e.name)}</span>
                    <span className="recent-text">
                      <span className="recent-name">{e.name}</span>
                      <span className="recent-meta">
                        {e.designation}
                        {e.department ? ` · ${e.department}` : ""}
                      </span>
                    </span>
                    {e.joiningDate && <span className="recent-date">{formatDate(e.joiningDate)}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card list-card">
          <div className="card-head">
            <h2 className="card-title">Document types</h2>
          </div>
          <ul className="doctype-list">
            {DOC_TYPES.map((d) => (
              <li key={d.key} className="doctype-row">
                <span className="doctype-code">{d.code}</span>
                <span className="doctype-label">{d.label}</span>
              </li>
            ))}
          </ul>
          <p className="muted" style={{ marginTop: 14 }}>
            Open an employee to generate any of these on the company letterhead.
          </p>
        </section>
      </div>
    </>
  );
}
