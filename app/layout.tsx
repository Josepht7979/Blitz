import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaClient from "./pwa-client";

export const metadata: Metadata = {
  applicationName: "Scripture Blitz",
  title: "Scripture Blitz",
  description: "How well — and how fast — do you know the Word?",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Scripture Blitz", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#ff8c42",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Cinzel:wght@600;800&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <PwaClient />
      </body>
    </html>
  );
}
