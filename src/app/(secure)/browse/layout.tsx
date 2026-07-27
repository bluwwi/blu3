import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Rooms",
  description:
    "Browse and join active music rooms on Blu3. Discover what your friends are listening to, create your own room, and enjoy real-time synced music together.",
  openGraph: {
    title: "Blu3 — Browse Rooms",
    description:
      "Browse active music rooms, join friends, and listen together in real-time. Free, no ads, cross-platform.",
    url: "https://blu3.in/browse",
    images: [{ url: "/api/og?home=1&v=4", width: 600, height: 315 }],
  },
  twitter: {
    title: "Blu3 — Browse Rooms",
    description:
      "Browse active music rooms, join friends, and listen together in real-time.",
    images: ["/api/og?home=1&v=4"],
  },
};

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
