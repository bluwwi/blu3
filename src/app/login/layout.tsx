import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Sign in to Blu3 with Google or Discord to create music rooms, listen together with friends, and enjoy millions of songs in real-time sync.",
  openGraph: {
    siteName: "Blu3",
    title: "Blu3 — Sign In",
    description:
      "Sign in with Google or Discord to start listening together in real-time music rooms.",
    url: "https://blu3.in/login",
    images: [{ url: "/api/og?home=1&v=4", width: 600, height: 315 }],
  },
  twitter: {
    title: "Blu3 — Sign In",
    description:
      "Sign in with Google or Discord to start listening together in real-time music rooms.",
    images: ["/api/og?home=1&v=4"],
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
