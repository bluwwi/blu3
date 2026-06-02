"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  Search,
  X,
  Plus,
  Play,
  Loader2,
  Music2,
  Clock,
  Heart,
} from "lucide-react";
import { Track } from "@/utils/types";
import { usePlaylists } from "@/hooks/usePlaylists";

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
  const { likedTrackIds, toggleLike } = usePlaylists();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const getTrackKey = (track: Track, index?: number) =>
    track.videoId ||
    track.id ||
    `${track.name}-${track.artists?.[0]?.name ?? ""}-${index ?? 0}`;

  const toggleSelect = (track: Track, index?: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const key = getTrackKey(track, index);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleAddSelected = () => {
    if (selectedIds.size > 0) {
      results.forEach((track, i) => {
        const key = getTrackKey(track, i);
        if (selectedIds.has(key) && onAddToQueue) {
          onAddToQueue(track);
        }
      });
      clearSelection();
    } else {
      results.forEach((track) => onAddToQueue?.(track));
    }
  };

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
  const showResults = searchQuery || results.length > 0;

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
        <div className="absolute inset-0 bg-black/55" />
      </div>

      {/* panel */}
      <div
        ref={overlayRef}
        onClick={handleBackdropClick}
        className={`fixed inset-0 z-[61] flex items-center justify-center px-4 transition-all duration-300 ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className={`w-full max-w-2xl transition-all duration-300 ${
            isOpen ? "translate-y-0 scale-100" : "-translate-y-4 scale-95"
          }`}
        >
          {/* search bar */}
          <div
            className={`flex items-center gap-3  border border-white/10  px-6 py-4 shadow-2xl backdrop-blur-3xl
${searchQuery ? "rounded-t-2xl" : "rounded-2xl"}
              transition-all focus-within:border-white/20 bg-black/50 focus-within:bg-black/60`}
          >
            <Search size={20} className="shrink-0 text-white/80" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by title, artist or album..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/80"
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
                className="rounded-full p-1 text-white/50 milano transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            ) : null}
          </div>

          {/* dropdown results panel */}
          <div
            className={`overflow-hidden rounded-b-xl border-x border-b border-white/10 bg-black/40 shadow-2xl backdrop-blur-3xl transition-all duration-200 ${
              showResults || showEmpty
                ? "max-h-[60vh] opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            {/* results */}
            {showResults && (
              <div className="flex flex-col" style={{ maxHeight: "60vh" }}>
                <div className="flex-1 overflow-y-auto room-scroll">
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

                  {results.map((track, index) => {
                    const key = getTrackKey(track, index);
                    const isSelected = selectedIds.has(key);
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
                        key={index}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleSelect(track, index)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleSelect(track, index);
                          }
                        }}
                        className={`group flex border-b border-white/20 duration-150 items-center gap-3 px-3 py-3 transition-colors cursor-pointer select-none ${
                          isSelected
                            ? ""
                            : isActive
                              ? "bg-white/10"
                              : "hover:bg-white/5 transition-all duration-300"
                        }`}
                      >
                        {/* thumbnail */}
                        <div
                          className="relative aspect-square shrink-0 overflow-hidden rounded-lg bg-white/10"
                          style={{
                            width: "clamp(3.25rem,2vw,199rem)",
                          }}
                        >
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
                        <div className="flex shrink-0 items-center gap-1">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelect(track, index);
                            }}
                            className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all cursor-pointer ${
                              isSelected
                                ? "bg-violet-600 border-violet-600"
                                : "border-white/40 hover:border-white/70"
                            }`}
                          >
                            {isSelected && (
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {selectedIds.size > 0 && (
                  <div className="border-t border-white/10">
                    <div className="flex items-center justify-between px-4 pt-2">
                      <span className="text-xs text-white/60">
                        {selectedIds.size} selected
                      </span>
                      <button
                        onClick={clearSelection}
                        className="text-xs text-white/50 hover:text-white transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto px-4 pb-2 pt-1.5 room-scroll">
                      {results
                        .filter((t, i) => selectedIds.has(getTrackKey(t, i)))
                        .map((track, i) => {
                          const thumbSrc =
                            track.image ||
                            (track.videoId
                              ? `https://i.ytimg.com/vi/${track.videoId}/default.jpg`
                              : undefined);
                          return (
                            <div
                              key={getTrackKey(track, i)}
                              className="flex shrink-0 items-center gap-2 rounded-lg bg-white/10 px-2.5 py-1.5"
                            >
                              <div className="h-8 w-8 shrink-0 overflow-hidden rounded bg-white/10">
                                {thumbSrc ? (
                                  <img
                                    src={thumbSrc}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Music2
                                    size={10}
                                    className="m-auto text-white/30"
                                  />
                                )}
                              </div>
                              <span className="max-w-[100px] truncate text-xs text-white/80">
                                {track.name}
                              </span>

                              {/*Cancel button*/}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
                {searchQuery && (
                  <div className="border-t border-white/10 bg-black/60 p-2">
                    <button
                      onClick={handleAddSelected}
                      className="flex w-full items-center justify-center cursor-pointer  gap-2 rounded-sm bg-white px-4 py-3 text-base font-medium text-black transition-all hover:bg-white/80"
                    >
                      Add{" "}
                      {selectedIds.size > 0
                        ? `selected (${selectedIds.size})`
                        : ""}{" "}
                      to queue
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
