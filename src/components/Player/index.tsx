"use client";

import { useState, useCallback } from "react";
import { YouTubeIframe } from "./ui/YouTubeIframe";
import { NowPlayingBar } from "./ui/NowPlayingBar";
import { SearchTab } from "./ui/SearchTab";
import { UrlTab } from "./ui/UrlTab";
import { useYouTubeAPI } from "@/hooks/useYouTubeAPI";
import { usePlayerState } from "@/hooks/usePlayerState";
import { useProgressTracking } from "@/hooks/useProgressTracking";
import { useSuggestions } from "@/hooks/useSuggestions";
import { useSearch } from "@/hooks/useSearch";
import { extractVideoId } from "@/utils/videoId";
import { Track } from "@/utils/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function Player() {
  const [activeTab, setActiveTab] = useState<"search" | "url">("search");

  // Hooks
  const { apiReady } = useYouTubeAPI();
  const playerState = usePlayerState();
  const progressState = useProgressTracking(
    playerState.playerRef,
    playerState.playerState,
  );
  const searchState = useSearch();
  const suggestState = useSuggestions(API_URL);

  // URL Tab Handler
  const handleUrlPlay = useCallback(() => {
    const inputEl = document.getElementById("url-input") as HTMLInputElement;
    const urlInput = inputEl?.value || "";

    playerState.setError("");
    const vid = extractVideoId(urlInput.trim());

    if (!vid) {
      playerState.setError("Invalid YouTube URL or video ID.");
      return;
    }

    playerState.setPlayerState("loading");
    playerState.setNowPlaying(null);

    // Create minimal track for URL
    const track: Track = {
      id: `url-${vid}`,
      videoId: vid,
      name: "Playing from URL",
      duration_ms: 0,
      explicit: false,
      artists: [{ name: "Unknown" }],
      album: { name: "YouTube" },
      image: "",
    };
    playerState.playTrack(track);
  }, [playerState]);

  // Keyboard handlers for search
  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        searchState.doSearch(searchState.searchQuery);
        suggestState.hideSuggestions();
      }
      if (e.key === "Escape") {
        suggestState.hideSuggestions();
      }
    },
    [searchState, suggestState],
  );

  return (
    <>
      <YouTubeIframe />

      <div
        className="min-h-screen bg-[#080808] text-white flex flex-col"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        {/* Google Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap"
          rel="stylesheet"
        />

        {/* Now Playing Bar */}
        {playerState.playerState !== "idle" && (
          <NowPlayingBar
            track={playerState.nowPlaying}
            activeVideoId={playerState.activeVideoId}
            playerState={playerState.playerState}
            progress={progressState.progress}
            currentTime={progressState.currentTime}
            duration={progressState.duration}
            volume={playerState.volume}
            isMuted={playerState.isMuted}
            onPlayPause={playerState.togglePlayPause}
            onMute={playerState.toggleMute}
            onVolume={playerState.handleVolume}
            onSeek={progressState.handleSeek}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 pt-10 pb-44">
          {/* Header */}
          <div className="mb-8">
            <h1
              className="text-4xl font-extrabold tracking-tight mb-1"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              <span className="text-green-500">▶</span> YT Audio
            </h1>
            <p className="text-zinc-600 text-xs tracking-[0.2em] uppercase">
              YouTube Music search · YouTube audio
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1 mb-6 bg-zinc-900/80 rounded-xl p-1 border border-zinc-800">
            {(["search", "url"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-xs font-medium rounded-lg transition-all tracking-widest uppercase ${
                  activeTab === tab
                    ? "bg-white text-black shadow"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab === "search" ? "⌕ Search" : "⊕ URL"}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "search" ? (
            <SearchTab
              searchQuery={searchState.searchQuery}
              suggestions={suggestState.suggestions}
              showSuggestions={suggestState.showSuggestions}
              results={searchState.results}
              isSearching={searchState.isSearching}
              searchError={searchState.searchError}
              activeTrackId={playerState.nowPlaying?.id ?? null}
              loadingTrackId={playerState.loadingId}
              isPlaying={playerState.playerState === "playing"}
              onSearchInput={searchState.onSearchInput}
              onSearch={searchState.doSearch}
              onSuggestionSelect={(s) => {
                searchState.setSearchQuery(s);
                searchState.doSearch(s);
                suggestState.hideSuggestions();
              }}
              onTrackSelect={playerState.playTrack}
              onFocus={() =>
                suggestState.suggestions.length > 0 &&
                suggestState.setShowSuggestions(true)
              }
              onBlur={() =>
                setTimeout(() => suggestState.hideSuggestions(), 200)
              }
              onKeyDown={handleSearchKeyDown}
            />
          ) : (
            <UrlTab
              onPlay={playerState.playTrack}
              isLoading={playerState.playerState === "loading"}
              error={playerState.error || null}
            />
          )}
        </div>
      </div>
    </>
  );
}
