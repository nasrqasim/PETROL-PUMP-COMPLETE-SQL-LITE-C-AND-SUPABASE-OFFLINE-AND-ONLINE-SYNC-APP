import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MobileNavHeader } from "@/components/MobileNavHeader";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

export const metadata: Metadata = {
  title: "Oil Shop & Transport Roznamcha Management System",
  description: "Complete Cloud & Offline Oil Shop, Roznamcha, Vehicle Ledger & Accounting System by Roonjha Developer",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Roznamcha App",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Roznamcha" />
      </head>
      <body className="min-h-screen bg-slate-50 flex flex-col text-slate-800 antialiased selection:bg-amber-500 selection:text-slate-900">
        <MobileNavHeader>{children}</MobileNavHeader>
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
