import type { Metadata } from "next";
import { RoomMetadata } from "@/components/RoomMetadata";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://blu3.in";

  let hostName = "";
  let hostAvatar = "";
  let roomName = "";

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.blu3.in";
    const res = await fetch(`${apiUrl}/api/rooms/${code}/og`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      hostName = data.hostName || "";
      hostAvatar = data.hostImage || "";
      roomName = data.roomName || "";
    }
  } catch {}

  const ogParams = new URLSearchParams({ code });
  if (hostName) ogParams.set("name", hostName);
  if (hostAvatar) ogParams.set("avatar", hostAvatar);
  if (roomName) ogParams.set("room", roomName);

  ogParams.set("v", "3");
  const ogUrl = `${appUrl}/api/og?${ogParams}`;

  const firstName = hostName ? hostName.split(" ")[0] : code;

  return {
    openGraph: {
      siteName: "Blu3",
      title: `Blu3 X ${firstName}`,
      description: "Join me in a real-time music room on Blu3. Listen together, queue tracks, and vibe with friends — free and cross-platform.",
      images: [{ url: ogUrl, width: 600, height: 315 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Blu3 X ${firstName}`,
      description: "Join me in a real-time music room on Blu3. Listen together, queue tracks, and vibe with friends — free and cross-platform.",
      images: [ogUrl],
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
