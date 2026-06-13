"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { Track } from "@/utils/types";
import { QueueAndHistory } from "@/components/Player/ui/QueueAndHistory";

const DEMO_TRACKS: Track[] = [
  { id: "demo-1", source: "youtube", videoId: "d1", name: "Sunflower", duration_ms: 0, explicit: false, artists: [{ name: "Post Malone & Swae Lee" }], album: { name: "Spider-Man: Into the Spider-Verse" }, image: "/queue/sunflower.jpg" },
  { id: "demo-2", source: "youtube", videoId: "d2", name: "Blu3 Dreams", duration_ms: 0, explicit: false, artists: [{ name: "Luna Ray" }], album: { name: "Night Visions" }, image: "/queue/cat.jpg" },
  { id: "demo-3", source: "youtube", videoId: "d3", name: "Midnight City", duration_ms: 0, explicit: false, artists: [{ name: "M83" }], album: { name: "Hurry Up, We're Dreaming" }, image: "/queue/camera.jpg" },
  { id: "demo-4", source: "youtube", videoId: "d4", name: "Vibes", duration_ms: 0, explicit: false, artists: [{ name: "Kyle Dixon" }], album: { name: "Stranger Things" }, image: "/queue/vibe.jpg" },
  { id: "demo-5", source: "youtube", videoId: "d5", name: "Rose Gold", duration_ms: 0, explicit: false, artists: [{ name: "The Blaze" }], album: { name: "Dancehall" }, image: "/queue/rose.jpg" },
];

const DEMO_RECENT = [
  { videoId: "r1", trackName: "Heartbeat", artistName: "TheXX", image: "/queue/heart.jpg", playedAt: Date.now() - 300000 },
  { videoId: "r2", trackName: "Redbone", artistName: "Childish Gambino", image: "/queue/red.jpg", playedAt: Date.now() - 600000 },
  { videoId: "r3", trackName: "Hiatus", artistName: "Tycho", image: "/queue/hi.jpg", playedAt: Date.now() - 900000 },
];

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err === "account_not_linked") {
      setOauthError("Sign-in failed because an account already exists with this email. Try a different sign-in method.");
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => {
        setPrev(c);
        return (c + 1) % TOTAL;
      });
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <>


      <div className="page">
        <div className="grain" />

        {oauthError && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600/90 text-white px-5 py-3 rounded-xl text-sm max-w-md text-center shadow-lg backdrop-blur-sm">
            {oauthError}
          </div>
        )}

        <img src="/logo/bg.svg" alt="Blu3" className="logo" draggable={false} />

        <div className="frame">
          <div
            key={`enter-${current}`}
            className="slide slide-enter"
            onAnimationEnd={() => setPrev(null)}
          >
            <img src={`/photos/${current + 1}.jpg`} alt="" draggable={false} />
          </div>

          {prev !== null && (
            <div key={`exit-${prev}`} className="slide slide-exit">
              <img src={`/photos/${prev + 1}.jpg`} alt="" draggable={false} />
            </div>
          )}
        </div>

        <button
          className="btn"
          onClick={() => (window.location.href = "/login")}
        >
          <span>get started</span>
        </button>
      </div>
    </>
  );
}
