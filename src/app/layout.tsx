import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Finance HQ",
  description: "Dual-book financial management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <div className="app-shell">
          <Sidebar />
          <main className="main-area">{children}</main>
        </div>
      </body>
    </html>
  );
}
