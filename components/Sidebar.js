"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Inline SVGs keep us free of any icon library (per project conventions).
const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6" />
      <path d="M17.5 20a5.5 5.5 0 0 0-3-4.9" />
    </svg>
  ),
  add: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="8" r="3.4" />
      <path d="M3.5 20a6.5 6.5 0 0 1 11.5-4.1" />
      <path d="M18 14v6M15 17h6" />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2.5h7L19 8v13.5H6z" />
      <path d="M13 2.5V8h6" />
      <path d="M9 13h6M9 16.5h6" />
    </svg>
  ),
  tags: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5H4v8l9.5 9.5a1.5 1.5 0 0 0 2.1 0l4.4-4.4a1.5 1.5 0 0 0 0-2.1L12 2.5z" />
      <circle cx="8" cy="6.5" r="1.3" />
    </svg>
  ),
};

const NAV = [
  { href: "/", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/employees", label: "Employees", icon: "users" },
  { href: "/new", label: "Add employee", icon: "add" },
  { href: "/settings", label: "Departments & Roles", icon: "tags" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <aside className="sidebar">
      <Link href="/" className="sidebar-brand">
        <span className="brand-mark">IW</span>
        <span className="sidebar-brand-text">Inteliweave</span>
      </Link>

      <nav className="side-nav">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`side-link${isActive(item) ? " active" : ""}`}
          >
            <span className="side-icon">{icons[item.icon]}</span>
            <span className="side-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-foot">
        <span className="side-icon">{icons.doc}</span>
        <span className="side-label">HR Documents</span>
      </div>
    </aside>
  );
}
