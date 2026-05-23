// components/Player/index.tsx
"use client";

import { usePlayerState } from "@/hooks/usePlayerState";
import { useProgressTracking } from "@/hooks/useProgressTracking";
import { useState } from "react";
import { YouTubeIframe } from "./ui/YouTubeIframe";
import { useYouTubeAPI } from "@/hooks/useYouTubeAPI";

export default function Player() {
  const [activeTab, setActiveTab] = useState<"search" | "url">("search");
  const { apiReady } = useYouTubeAPI();
  const {
    playerRef,
    playerState,
    volume,
    isMuted,
    nowPlaying,
    activeVideoId,
    playTrack,
    togglePlayPause,
    handleVolume,
    toggleMute,
  } = usePlayerState();
  const {
    progress,
    currentTime,
    duration,
    startTracking,
    stopTracking,
    handleSeek,
  } = useProgressTracking(playerRef, playerState);

  return (
    <>
      <YouTubeIframe />
      {playerState !== "idle" && (

      )}


    </>
  );
}
