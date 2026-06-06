import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const ogUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://blu3.in"}/api/og?code=${code}`;
  return {
    openGraph: {
      title: `Join me on Blu3 — Room ${code}`,
      description: "Listening to music together in real-time",
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Join me on Blu3 — Room ${code}`,
      description: "Listening to music together in real-time",
      images: [ogUrl],
    },
  };
}

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return children;
}
