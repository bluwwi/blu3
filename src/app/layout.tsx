import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PlaylistsProvider } from "@/hooks/usePlaylists";
import { AuthGate } from "@/components/LoginPopup";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  metadataBase: new URL("https://blu3.in"),
  title: "Blu3",
  description: "Blu3 — music rooms",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Blu3",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  openGraph: {
    title: "Blu3 — Music Rooms",
    description: "Listen to music together in real-time with friends",
    url: "https://blu3.in",
    siteName: "Blu3",
    images: [{ url: "/api/og?home=1", width: 600, height: 315 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blu3 — Music Rooms",
    description: "Listen to music together in real-time with friends",
    images: ["/api/og?home=1"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",psome-change
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`milano  text-black h-full antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo/logo.png" sizes="512x512" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="min-h-full flex flex-col">
        <PlaylistsProvider>
          <AuthGate>{children}</AuthGate>
        </PlaylistsProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
