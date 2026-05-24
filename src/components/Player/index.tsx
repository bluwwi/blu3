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
import { LayoutGrid, Music2, Play, Radio, Search } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function Player() {
  const [activeTab, setActiveTab] = useState<"search" | "url">("search");
  const [activePill, setActivePill] = useState<
    "listen" | "browse" | "radio" | "playlists"
  >("listen");

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

  const carouselTracks = (searchState.results.length > 0
    ? searchState.results
    : playerState.nowPlaying
      ? [playerState.nowPlaying]
      : []
  ).slice(0, 8);

  return (
    <>
      <YouTubeIframe />
      <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600')] bg-cover bg-center bg-fixed text-white">
        <div className="min-h-screen bg-slate-950/55 px-4 pb-40 pt-6 md:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="relative flex items-center justify-between">
              <div className="hidden rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-xl md:flex">
                {apiReady ? "YouTube ready" : "Loading player"}
              </div>
              <div className="absolute left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 p-1.5 backdrop-blur-xl">
                  {[
                    { id: "listen", label: "Listen Now", icon: Play },
                    { id: "browse", label: "Browse", icon: LayoutGrid },
                    { id: "radio", label: "Radio", icon: Radio },
                    { id: "playlists", label: "Playlists", icon: Music2 },
                  ].map((item) => {
                    const Icon = item.icon;
                    const selected = activePill === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActivePill(item.id as typeof activePill)}
                        className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm transition-colors ${
                          selected
                            ? "bg-white/25 text-white"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Icon size={16} />
                        <span className="hidden sm:inline">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="ml-auto flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-xl">
                {loading ? (
                  <div className="h-8 w-24 animate-pulse rounded-full bg-white/10" />
                ) : user ? (
                  <>
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 text-xs font-semibold">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        user.name.slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <span className="hidden max-w-[180px] truncate text-sm text-white/80 md:block">
                      {user.email}
                    </span>
                    <button
                      onClick={logout}
                      className="rounded-full px-3 py-2 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={login}
                    className="rounded-full px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    Sign in
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[28px] border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-xl">
              <Search size={16} className="text-white/70" />
              <input
                value={searchState.searchQuery}
                onChange={(e) => searchState.onSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={() =>
                  suggestState.suggestions.length > 0 &&
                  suggestState.setShowSuggestions(true)
                }
                onBlur={() => setTimeout(() => suggestState.hideSuggestions(), 200)}
                placeholder="Search by title, artist or album..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/45"
              />
            </div>

            <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
              {(carouselTracks.length > 0
                ? carouselTracks
                : Array.from({ length: 8 }, (_, index) => index)
              ).map((item, index) => {
                const image =
                  typeof item === "number"
                    ? `https://picsum.photos/seed/${index}/144/144`
                    : item.image || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;
                const key =
                  typeof item === "number" ? `placeholder-${item}` : `${item.id}-${index}`;

                return (
                  <div
                    key={key}
                    className="h-36 w-36 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-white/10"
                  >
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  </div>
                );
              })}
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <div className="rounded-[32px] border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
                <div className="mb-5 flex gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                  {(["search", "url"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 rounded-full px-4 py-2 text-sm transition-colors ${
                        activeTab === tab
                          ? "bg-white/20 text-white"
                          : "text-white/60 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {tab === "search" ? "Search" : "YouTube URL"}
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
                    onBlur={() => setTimeout(() => suggestState.hideSuggestions(), 200)}
                    onKeyDown={handleSearchKeyDown}
                    avatarUrl={user?.avatar}
                    avatarLabel={user?.name ?? user?.email ?? "U"}
                  />
                ) : (
                  <UrlTab
                    onPlay={playerState.playTrack}
                    isLoading={playerState.playerState === "loading"}
                    error={playerState.error || null}
                  />
                )}
              </div>

              <div className="rounded-[32px] border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
                <RoomPanel
                  onPlaybackPlay={(state) => {
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
                  onPlaybackPause={() => playerState.pause?.()}
                  onPlaybackSeek={(t) => progressState.seekTo(t)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </>
  );
}
