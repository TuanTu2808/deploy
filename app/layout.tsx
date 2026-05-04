import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import SmoothScrollProvider from "@/app/components/SmoothScrollProvider";
import AuthModalGate from "@/app/components/auth/AuthModalGate";
import AppProviders from "@/app/components/providers/AppProviders";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: { default: "25Zone", template: "%s | 25Zone" },
  description: "25Zone - Chuỗi cắt tóc nam",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{ children: React.ReactNode; modal: React.ReactNode }>) {
  return (
    <html lang="vi" className={inter.className}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body suppressHydrationWarning>
        <AppProviders>
          <Suspense fallback={null}>
            <SmoothScrollProvider>
              <Header />
              {children}
              <Footer />
              <AuthModalGate />
              {modal}
            </SmoothScrollProvider>
          </Suspense>
        </AppProviders>
      </body>
    </html>
  );
}
