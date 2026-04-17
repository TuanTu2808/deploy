import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import AdminShell from "./component/admin-shell";

/* FONT INTER */
const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Admin Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        {/* FONT AWESOME */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>

      <body className={`${inter.className} flex min-h-screen`}>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
