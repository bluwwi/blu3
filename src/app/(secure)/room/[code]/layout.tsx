import type { Metadata } from "next";
import { RoomMetadata } from "@/components/RoomMetadata";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;

  return {
    openGraph: {
      siteName: "Blu3",
      title: `Blu3 X ${code}`,
      description: "Join me in a real-time music room on Blu3. Listen together, queue tracks, and vibe with friends — free and cross-platform.",
      images: [{ url: "/banner.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Blu3 X ${code}`,
      description: "Join me in a real-time music room on Blu3. Listen together, queue tracks, and vibe with friends — free and cross-platform.",
      images: ["/XBanner.png"],
    },
  };
}

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RoomMetadata />
      {children}
    </>
  );
}
