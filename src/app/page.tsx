"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { Track } from "@/utils/types";
import { QueueAndHistory } from "@/components/Player/ui/QueueAndHistory";
import { WaveformVisualizer } from "@/components/Player/ui/WaveformVisualizer";
import Image from "next/image";

const DEMO_TRACKS: Track[] = [
  {
    id: "demo-1",
    source: "youtube",
    videoId: "d1",
    name: "Sunflower",
    duration_ms: 0,
    explicit: false,
    artists: [{ name: "Post Malone & Swae Lee" }],
    album: { name: "Spider-Man: Into the Spider-Verse" },
    image: "/queue/sunflower.jpg",
  },
  {
    id: "demo-2",
    source: "youtube",
    videoId: "d2",
    name: "Blu3 Dreams",
    duration_ms: 0,
    explicit: false,
    artists: [{ name: "Luna Ray" }],
    album: { name: "Night Visions" },
    image: "/queue/cat.jpg",
  },
  {
    id: "demo-3",
    source: "youtube",
    videoId: "d3",
    name: "Midnight City",
    duration_ms: 0,
    explicit: false,
    artists: [{ name: "M83" }],
    album: { name: "Hurry Up, We're Dreaming" },
    image: "/queue/camera.jpg",
  },
  {
    id: "demo-4",
    source: "youtube",
    videoId: "d4",
    name: "Vibes",
    duration_ms: 0,
    explicit: false,
    artists: [{ name: "Kyle Dixon" }],
    album: { name: "Stranger Things" },
    image: "/queue/vibe.jpg",
  },
  {
    id: "demo-5",
    source: "youtube",
    videoId: "d5",
    name: "Rose Gold",
    duration_ms: 0,
    explicit: false,
    artists: [{ name: "The Blaze" }],
    album: { name: "Dancehall" },
    image: "/queue/rose.jpg",
  },
];

function getDemoRecent() {
  const now = Date.now();
  return [
    {
      videoId: "r1",
      trackName: "Heartbeat",
      artistName: "TheXX",
      image: "/queue/heart.jpg",
      playedAt: now - 300000,
    },
    {
      videoId: "r2",
      trackName: "Redbone",
      artistName: "Childish Gambino",
      image: "/queue/red.jpg",
      playedAt: now - 600000,
    },
    {
      videoId: "r3",
      trackName: "Hiatus",
      artistName: "Tycho",
      image: "/queue/hi.jpg",
      playedAt: now - 900000,
    },
  ];
}

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err === "account_not_linked") {
      setOauthError(
        "Sign-in failed because an account already exists with this email. Try a different sign-in method.",
      );
    } else if (err) {
      setOauthError("Sign-in failed");
    }
    if (err) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      const returnUrl = sessionStorage.getItem("returnUrl");
      if (returnUrl) {
        sessionStorage.removeItem("returnUrl");
        router.replace(returnUrl);
      } else {
        router.replace("/browse");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="relative w-full min-h-screen h-full  overflow-y-auto lg:overflow-hidden bg-[#131313] flex flex-col lg:flex-row">
      <div className="flex flex-col items-center justify-center w-full h-full min-h-screen">
        <Image
          src={"/logo/blu3.svg"}
          width={2000}
          height={2000}
          alt={"hello"}
          className="w-[10%] absolute rounded-3xl h-fit"
        />
      </div>
    </div>
  );
}
