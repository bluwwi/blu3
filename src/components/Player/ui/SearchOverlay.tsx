"use client";

import { useEffect, useRef, useCallback } from "react";
import { Search, X, Plus, Play, Loader2, Music2, Clock } from "lucide-react";
import { Track } from "@/utils/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;

  // search state
  searchQuery: string;
  suggestions: string[];
  showSuggestions: boolean;
  results: Track[];
  isSearching: boolean;
  searchError: string;
  recentTracks?: Track[];

  // player state
  activeTrackId: string | null;
  loadingTrackId: string | null;
  isPlaying: boolean;

  // handlers
  onSearchInput: (val: string) => void;
  onSearch: (q: string) => void;
  onSuggestionSelect: (s: string) => void;
  onTrackSelect?: (track: Track) => void;
  onAddToQueue?: (track: Track) => void;

  avatarUrl?: string;
  avatarLabel?: string;

  popularGenres?: string[];
}

function formatDuration(ms: number) {
  if (!ms) return "";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SearchOverlay({
  isOpen,
  onClose,
  searchQuery,
  suggestions,
  showSuggestions,
  results,
  isSearching,
  searchError,
  recentTracks = [],
  activeTrackId,
  loadingTrackId,
  isPlaying,
  onSearchInput,
  onSearch,
  onSuggestionSelect,
  onTrackSelect,
  onAddToQueue,
  avatarUrl,
  avatarLabel = "U",
  popularGenres = [
    "Pop hits",
    "Hip hop",
    "Lo-fi",
    "Rock classics",
    "Bollywood",
    "EDM",
  ],
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch(searchQuery);
    }
  };

  const showEmpty = !searchQuery && results.length === 0 && !isSearching;
  const showResults = (searchQuery || results.length > 0) && !showSuggestions;

  return (
    <>
      {/* backdrop */}
      <div
        className={`fixed inset-0 z-[60] transition-all duration-300 ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        style={{ backdropFilter: isOpen ? "blur(12px)" : "blur(0px)" }}
      >
        <div className="absolute inset-0 bg-slate-950/80" />
      </div>

      {/* panel */}
      <div
        ref={overlayRef}
        onClick={handleBackdropClick}
        className={`fixed inset-0 z-[61] flex items-start justify-center px-4 pt-[10vh] transition-all duration-300 ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className={`w-full max-w-xl transition-all duration-300 ${
            isOpen ? "translate-y-0 scale-100" : "-translate-y-4 scale-95"
          }`}
        >
          {/* search bar */}
          <div className="flex items-center gap-3 rounded-[22px] border border-white/25 bg-white/12 px-4 py-3 shadow-2xl backdrop-blur-2xl">
            <Search size={16} className="shrink-0 text-white/60" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by title, artist or album..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
            />
            {isSearching ? (
              <Loader2
                size={15}
                className="shrink-0 animate-spin text-white/60"
              />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  onSearchInput("");
                  onSearch("");
                }}
                className="rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={13} />
              </button>
            ) : null}

            {/* avatar */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 text-[11px] font-semibold text-white">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={avatarLabel}
                  className="h-full w-full object-cover"
                />
              ) : (
                avatarLabel.slice(0, 1).toUpperCase()
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>

          {/* dropdown results panel */}
          <div
            className={`mt-3 overflow-hidden rounded-[22px] border border-white/15 bg-slate-950/80 shadow-2xl backdrop-blur-2xl transition-all duration-200 ${
              showSuggestions || showResults || showEmpty
                ? "max-h-[60vh] opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            {/* suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="room-scroll max-h-[50vh] overflow-y-auto p-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onSuggestionSelect(s)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/70 transition-colors hover:bg-white/8 hover:text-white"
                  >
                    <Search size={12} className="shrink-0 text-white/35" />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            )}

            {/* results */}
            {showResults && (
              <div className="room-scroll max-h-[55vh] overflow-y-auto p-2">
                {isSearching && results.length === 0 && (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-white/40">
                    <Loader2 size={15} className="animate-spin" />
                    Searching...
                  </div>
                )}

                {!isSearching && searchError && (
                  <div className="py-8 text-center text-sm text-red-400/70">
                    {searchError}
                  </div>
                )}

                {!isSearching &&
                  !searchError &&
                  results.length === 0 &&
                  searchQuery && (
                    <div className="py-8 text-center text-sm text-white/35">
                      No results for &ldquo;{searchQuery}&rdquo;
                    </div>
                  )}

                {results.map((track) => {
                  const isActive =
                    activeTrackId === track.id ||
                    activeTrackId === track.videoId;
                  const isLoading =
                    loadingTrackId === track.id ||
                    loadingTrackId === track.videoId;
                  const thumbSrc =
                    track.image ||
                    (track.videoId
                      ? `https://i.ytimg.com/vi/${track.videoId}/default.jpg`
                      : undefined);

                  return (
                    <div
                      key={track.id}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                        isActive ? "bg-white/12" : "hover:bg-white/8"
                      }`}
                    >
                      {/* thumbnail */}
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/10">
                        {thumbSrc ? (
                          <img
                            src={thumbSrc}
                            alt={track.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Music2 size={14} className="text-white/30" />
                          </div>
                        )}
                        {isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Loader2
                              size={12}
                              className="animate-spin text-white"
                            />
                          </div>
                        )}
                        {isActive && !isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <div className="flex gap-[2px] items-end h-3">
                              {[1, 2, 3].map((b) => (
                                <div
                                  key={b}
                                  className={`w-[3px] rounded-full bg-white ${
                                    isPlaying ? "animate-bounce" : ""
                                  }`}
                                  style={{
                                    height: `${[60, 100, 75][b - 1]}%`,
                                    animationDelay: `${(b - 1) * 0.15}s`,
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* info */}
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-medium leading-tight ${
                            isActive ? "text-white" : "text-white/85"
                          }`}
                        >
                          {track.name}
                        </p>
                        <p className="truncate text-xs text-white/45 mt-0.5">
                          {track.artists?.map((a) => a.name).join(", ")}
                          {track.duration_ms
                            ? ` · ${formatDuration(track.duration_ms)}`
                            : ""}
                        </p>
                      </div>

                      {/* actions */}
                      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {onAddToQueue && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToQueue(track);
                            }}
                            title="Add to queue"
                            className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                        {onTrackSelect && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTrackSelect(track);
                            }}
                            title="Play now"
                            className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                          >
                            <Play size={12} className="translate-x-[1px]" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* empty state: genre chips + recent */}
            {showEmpty && (
              <div className="p-4 space-y-4">
                {recentTracks.length > 0 && (
                  <div>
                    <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-white/30">
                      Recently played
                    </p>
                    <div className="space-y-0.5">
                      {recentTracks.slice(0, 4).map((track) => {
                        const thumbSrc =
                          track.image ||
                          (track.videoId
                            ? `https://i.ytimg.com/vi/${track.videoId}/default.jpg`
                            : undefined);
                        return (
                          <button
                            key={track.id}
                            type="button"
                            onClick={() => onTrackSelect?.(track)}
                            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/8"
                          >
                            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-white/10">
                              {thumbSrc ? (
                                <img
                                  src={thumbSrc}
                                  alt={track.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Clock size={12} className="text-white/30" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm text-white/80">
                                {track.name}
                              </p>
                              <p className="truncate text-xs text-white/40">
                                {track.artists?.map((a) => a.name).join(", ")}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-2.5 px-1 text-xs font-semibold uppercase tracking-widest text-white/30">
                    Browse genres
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {popularGenres.map((genre) => (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => {
                          onSearchInput(genre);
                          onSearch(genre);
                        }}
                        className="rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-xs text-white/65 transition-colors hover:border-white/25 hover:bg-white/12 hover:text-white"
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* kbd hint */}
          {isOpen && (
            <p className="mt-3 text-center text-[11px] text-white/25">
              Press{" "}
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">
                Esc
              </kbd>{" "}
              to close
            </p>
          )}
        </div>
      </div>
    </>
  );
}
