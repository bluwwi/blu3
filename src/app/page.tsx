"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { Track } from "@/utils/types";
import { QueueAndHistory } from "@/components/Player/ui/QueueAndHistory";
import { WaveformVisualizer } from "@/components/Player/ui/WaveformVisualizer";

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
      setOauthError("Sign-in failed. Please try again.");
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
    <div className="relative w-full min-h-dvh overflow-y-auto lg:overflow-hidden bg-[#0D0D14] flex flex-col lg:flex-row">
      <div className="animate-gradient fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.08),transparent_50%)] pointer-events-none z-0" />
      <div className="animate-gradient fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.06),transparent_50%)] pointer-events-none z-0" style={{ animationDelay: "-10s" }} />
      <div className="grain" />

      {oauthError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600/90 text-white px-5 py-3 rounded-xl text-sm max-w-md text-center shadow-lg backdrop-blur-sm">
          {oauthError}
        </div>
      )}

      <div className="hidden lg:flex w-[40%] flex-col items-center justify-center p-8 gap-8">
        <img
          src="/logo/blu3.svg"
          alt="Blu3"
          className="w-64 h-auto object-contain select-none pointer-events-none"
          draggable={false}
        />
        <p className="text-white/60 text-center text-sm max-w-xs leading-relaxed">
          Listen together in real-time with friends. Create rooms, share music,
          and discover new sounds.
        </p>
        <button
          onClick={() => (window.location.href = "/login")}
          className="px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-medium transition-all cursor-pointer"
        >
          Get Started
        </button>
        <button
          onClick={() => (window.location.href = "/login")}
          className="text-white/40 hover:text-white/70 text-xs transition-colors cursor-pointer bg-transparent border-none"
        >
          Already have an account? Sign In
        </button>
        <div className="flex-1 w-full max-w-sm">
          <WaveformVisualizer />
        </div>
      </div>

      <div className="hidden lg:flex w-[60%] items-center justify-center p-8">
        <div className="relative w-full max-w-lg h-[70vh] md:rounded-3xl md:border-2 md:border-white/8 md:bg-white/5 md:backdrop-blur-2xl filter drop-shadow-[0_0_40px_rgba(0,0,0,1)] md:drop-shadow-[0_0_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col md:before:absolute md:before:inset-0 md:before:rounded-3xl md:before:pointer-events-none md:before:bg-gradient-to-b md:before:from-white/[0.04] md:before:to-transparent">
          <QueueAndHistory
            queue={DEMO_TRACKS}
            recentTracks={getDemoRecent()}
            canControlPlayback={false}
            handleAdminPlayTrack={() => {}}
            removeFromQueue={() => {}}
            addToQueue={() => {}}
            clearQueue={() => {}}
            activeVideoId={null}
            playerState="idle"
            shuffleEnabled={false}
            repeatMode="off"
            onToggleShuffle={() => {}}
            onCycleRepeat={() => {}}
            onSearchClick={() => {}}
          />
        </div>
      </div>

      <div className="flex lg:hidden w-full flex-col min-h-screen p-4 gap-4">
        <div className="flex flex-col items-center justify-center pt-8 pb-4 gap-4">
          <img
            src="/logo/blu3.svg"
            alt="Blu3"
            className="w-36 h-auto object-contain select-none pointer-events-none"
            draggable={false}
          />
          <p className="text-white/60 text-center text-xs max-w-xs leading-relaxed">
            Listen together in real-time with friends.
          </p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-medium transition-all cursor-pointer"
          >
            Get Started
          </button>
          <button
            onClick={() => (window.location.href = "/login")}
            className="text-white/40 hover:text-white/70 text-xs transition-colors cursor-pointer bg-transparent border-none"
          >
            Already have an account? Sign In
          </button>
        </div>
        <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl overflow-hidden flex flex-col min-h-0">
          <QueueAndHistory
            queue={DEMO_TRACKS}
            recentTracks={getDemoRecent()}
            canControlPlayback={false}
            handleAdminPlayTrack={() => {}}
            removeFromQueue={() => {}}
            addToQueue={() => {}}
            clearQueue={() => {}}
            activeVideoId={null}
            playerState="idle"
            shuffleEnabled={false}
            repeatMode="off"
            onToggleShuffle={() => {}}
            onCycleRepeat={() => {}}
            onSearchClick={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
