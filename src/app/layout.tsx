import "@/app/globals.css";
import { ReactNode } from "react";
import { AuthProvider } from "@/components/providers/SessionProvider";
import { APP_NAME } from "@/lib/company";
import PWARegistration from "@/components/pwa/PWARegistration";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata = {
  title: APP_NAME,
  description: `${APP_NAME} — Building Construction Material`,
  manifest: "/manifest.json",
  themeColor: "#060913",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AL Madina ERP" />
        <meta name="theme-color" content="#060913" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <ErrorBoundary>
          <PWARegistration />
          <AuthProvider>
            {children}
            <PWAInstallPrompt />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
