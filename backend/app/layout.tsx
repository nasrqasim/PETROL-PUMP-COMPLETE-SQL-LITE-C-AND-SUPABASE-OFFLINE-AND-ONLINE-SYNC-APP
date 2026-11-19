import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MobileNavHeader } from "@/components/MobileNavHeader";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

export const metadata: Metadata = {
  title: "Muslim Construction - Roznamcha & Accounts Management",
  description:
    "Muslim Construction - Daily Roznamcha, Vehicle Ledger, Accounting & Project Financials. Software by Roonjha Developers: 03152914836",
  manifest: "/manifest.json",
  applicationName: "Muslim Construction",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Muslim Construction",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Muslim ERP" />
        <meta name="application-name" content="Muslim ERP" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                window.__pwaDeferredPrompt = null;
                window.addEventListener('beforeinstallprompt', function(e) {
                  e.preventDefault();
                  window.__pwaDeferredPrompt = e;
                  window.dispatchEvent(new CustomEvent('pwa_prompt_ready'));
                });
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 flex flex-col text-slate-800 antialiased selection:bg-amber-500 selection:text-slate-900">
        <MobileNavHeader>{children}</MobileNavHeader>
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
