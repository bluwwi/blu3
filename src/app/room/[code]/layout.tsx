import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return {
    openGraph: {
      title: `Join me on Blu3 — Room ${code}`,
      description: "Listening to music together in real-time",
      images: [{ url: "/hero.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Join me on Blu3 — Room ${code}`,
      description: "Listening to music together in real-time",
      images: ["/hero.png"],
    },
  };
}

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return children;
}
