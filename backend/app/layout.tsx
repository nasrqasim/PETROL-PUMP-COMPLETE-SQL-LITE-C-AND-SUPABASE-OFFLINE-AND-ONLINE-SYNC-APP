import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MobileNavHeader } from "@/components/MobileNavHeader";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

export const metadata: Metadata = {
  title: "Muslim Construction - Roznamcha & Accounts Management",
  description: "Muslim Construction - Daily Roznamcha, Vehicle Ledger, Accounting & Project Financials. Software by Roonjha Developers: 03152914836",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Muslim Construction",
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
        <meta name="apple-mobile-web-app-title" content="Muslim Construction" />
      </head>
      <body className="min-h-screen bg-slate-50 flex flex-col text-slate-800 antialiased selection:bg-amber-500 selection:text-slate-900">
        <MobileNavHeader>{children}</MobileNavHeader>
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
