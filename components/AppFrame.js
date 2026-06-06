"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

// The public share pages (/share/...) get a bare layout with no internal nav.
export default function AppFrame({ children }) {
  const pathname = usePathname();
  const bare = pathname?.startsWith("/share");

  if (bare) {
    return <main className="bare-main">{children}</main>;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <main className="content">{children}</main>
        <footer className="footer">
          Documents are generated on the official Inteliweave pad · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
