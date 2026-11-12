import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MobileNavHeader } from "@/components/MobileNavHeader";

export const metadata: Metadata = {
  title: "Oil Shop & Transport Roznamcha Management System",
  description: "Complete Cloud & Offline Oil Shop, Roznamcha, Vehicle Ledger & Accounting System by Roonjha Developer",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ur" dir="ltr">
      <body className="min-h-screen bg-slate-50 flex flex-col text-slate-800 antialiased selection:bg-amber-500 selection:text-slate-900">
        <MobileNavHeader>{children}</MobileNavHeader>
      </body>
    </html>
  );
}
