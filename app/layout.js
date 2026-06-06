import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "Inteliweave · HR Documents",
  description: "Generate official HR letters on the company pad",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="app-shell">
          <Sidebar />
          <div className="app-main">
            <main className="content">{children}</main>
            <footer className="footer">
              Documents are generated on the official Inteliweave pad · {new Date().getFullYear()}
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
