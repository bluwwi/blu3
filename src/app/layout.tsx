import type { Metadata } from "next";
import "./globals.css";
import { PlaylistsProvider } from "@/hooks/usePlaylists";

export const metadata: Metadata = {
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
        <link
          rel="apple-touch-icon"
          href="/logo/logo.png"
          sizes="512x512"
        />
        <meta
          name="apple-mobile-web-app-capable"
          content="yes"
        />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="min-h-full flex flex-col">
        <PlaylistsProvider>{children}</PlaylistsProvider>
      </body>
    </html>
  );
}
