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
import { useAuth } from "@/hooks/useAuth";
import { extractVideoId } from "@/utils/videoId";
import { Track } from "@/utils/types";
import { RoomPanel } from "@/hooks/RoomPanel";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function Player() {
  const [activeTab, setActiveTab] = useState<"search" | "url">("search");

  const { apiReady } = useYouTubeAPI();
  const playerState = usePlayerState();
  const progressState = useProgressTracking(
    playerState.playerRef,
    playerState.playerState,
  );
  const searchState = useSearch();
  const suggestState = useSuggestions(API_URL);
  const { user, loading, login, logout } = useAuth();

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
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap"
          rel="stylesheet"
        />

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

        <div className="flex-1 max-w-2xl mx-auto w-full px-4 pt-10 pb-44">
          {/* ── AUTH BAR ── */}
          <div className="flex items-center justify-end mb-6 h-9">
            {loading ? (
              <div className="w-20 h-7 bg-zinc-800 rounded-lg animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                {user.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-full border border-zinc-700 object-cover"
                  />
                )}
                <span className="text-xl text-white tracking-wide truncate max-w-[120px]">
                  {user.email}
                </span>
                <button
                  onClick={logout}
                  className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors tracking-widest uppercase px-2 py-1 rounded border border-zinc-800 hover:border-zinc-600"
                >
                  out
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-400 bg-zinc-900 hover:bg-zinc-800 transition-all text-xs tracking-widest uppercase text-zinc-300"
              >
                {/* Google G icon */}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                sign in
              </button>
            )}
          </div>
          {/* ── END AUTH BAR ── */}

          <div className="mb-8">
            <h1
              className="text-4xl font-extrabold tracking-tight mb-1"
              style={{ fontFamily: "'Syne', sans-serif" }}
            ></h1>
          </div>

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

        <div className="mt-6">
          <RoomPanel
            onPlaybackPlay={(state) => {
              // state has videoId, trackName etc — load it into player
              if (state.videoId) {
                playerState.playTrack({
                  id: `room-${state.videoId}`,
                  videoId: state.videoId,
                  name: state.trackName,
                  duration_ms: 0,
                  explicit: false,
                  artists: [{ name: state.artistName }],
                  album: { name: "" },
                  image: state.image,
                });
              }
            }}
            onPlaybackPause={(t) => playerState.pause?.()}
            onPlaybackSeek={(t) => progressState.handleSeek(t)}
          />
        </div>
      </div>
    </>
  );
}
