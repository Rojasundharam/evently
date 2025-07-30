import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { NotificationProvider } from "@/lib/notifications";
import AuthGuard from "./components/AuthGuard";
import ErrorBoundary from "./components/ErrorBoundary";
import GlobalMobileNavigation from "./components/GlobalMobileNavigation";
import PWAInstaller from "./components/PWAInstaller";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Problem Bank",
  description: "A comprehensive platform for real-world problems, solutions, and community discussions",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Problem Bank",
  },
  formatDetection: {
    telephone: false,
  },
};

// Separate viewport export for Next.js 15+
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Problem Bank" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/icon-192.svg" sizes="192x192" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${poppins.variable} font-poppins antialiased`} suppressHydrationWarning>
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <NotificationProvider>
                <AuthGuard>
                  {children}
                </AuthGuard>
                <GlobalMobileNavigation />
                <PWAInstaller />
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
