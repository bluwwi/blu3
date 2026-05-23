"use client";

import { RecentTrack, Track } from "@/utils/types";
import { SearchInput } from "./SearchInput";
import { TrackList } from "./TrackList";
import { useState } from "react";

interface Props {
  recentTracks: RecentTrack[];
  searchQuery: string;
  suggestions: string[];
  showSuggestions: boolean;
  results: Track[];
  isSearching: boolean;
  searchError: string;

  // Player state
  activeTrackId: string | null;
  loadingTrackId: string | null;
  isPlaying: boolean;

  // Handlers
  onSearchInput: (val: string) => void;
  onSearch: (q: string) => void;
  onSuggestionSelect: (s: string) => void;
  onTrackSelect?: (track: Track) => void;
  onAddToQueue?: (track: Track) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function SearchTab({
  recentTracks = [],
  searchQuery,
  suggestions,
  showSuggestions,
  results,
  isSearching,
  searchError,
  activeTrackId,
  loadingTrackId,
  isPlaying,
  onSearchInput,
  onSearch,
  onSuggestionSelect,
  onTrackSelect,
  onAddToQueue,
  onFocus,
  onBlur,
  onKeyDown,
}: Props) {
  const handleRecentTrackSelect = (rt: RecentTrack) => {
    if (!onTrackSelect) return;
    const track: Track = {
      id: rt.videoId,
      videoId: rt.videoId,
      name: rt.trackName,
      duration_ms: 0,
      explicit: false,
      artists: [{ name: rt.artistName }],
      album: { name: "" },
      image: rt.image,
    };
    onTrackSelect(track);
  };

  return (
    <div>
      <SearchInput
        value={searchQuery}
        suggestions={suggestions}
        showSuggestions={showSuggestions}
        isSearching={isSearching}
        onInput={onSearchInput}
        onSearch={onSearch}
        onSuggestionSelect={onSuggestionSelect}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />

      {!searchQuery && recentTracks.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="text-xs text-zinc-500 tracking-widest uppercase font-semibold">
            🕒 Recently Played
          </h2>
          <div className="space-y-0.5 max-h-[350px] overflow-y-auto">
            {recentTracks.map((track, i) => {
              const isTrackActive = activeTrackId === track.videoId;
              const asTrack = {
                id: track.videoId,
                videoId: track.videoId,
                name: track.trackName,
                artists: [{ name: track.artistName }],
                album: { name: "" },
                image: track.image,
                duration_ms: 0,
                explicit: false,
              };

              return (
                <div
                  key={`${track.videoId}-${i}`}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl transition-all group border ${
                    isTrackActive
                      ? "bg-green-500/10 border-green-500/20"
                      : "border-transparent hover:bg-zinc-900/60 hover:border-zinc-800/60"
                  }`}
                >
                  <div
                    onClick={() => handleRecentTrackSelect(track)}
                    className="flex-1 flex items-center gap-3 min-w-0 cursor-pointer"
                  >
                    <img
                      src={track.image}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${isTrackActive ? "text-green-500" : "text-white"}`}>
                        {track.trackName}
                      </p>
                      <p className="text-zinc-500 text-[10px] truncate mt-0.5">
                        {track.artistName}
                      </p>
                    </div>
                    {isTrackActive && isPlaying && (
                      <div className="flex gap-[2px] items-end h-3 pr-2">
                        {[0, 1, 2].map((idx) => (
                          <div
                            key={idx}
                            className="w-[2.5px] bg-green-400 rounded-full animate-bounce"
                            style={{
                              height: `${4 + idx * 2}px`,
                              animationDelay: `${idx * 100}ms`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {onAddToQueue && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToQueue(asTrack);
                      }}
                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 active:scale-95 transition-all text-sm font-bold shadow-sm"
                      title="Add to room queue"
                    >
                      ＋
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(searchQuery || results.length > 0) && (
        <TrackList
          tracks={results}
          activeTrackId={activeTrackId}
          loadingTrackId={loadingTrackId}
          isPlaying={isPlaying}
          onTrackSelect={onTrackSelect}
          onAddToQueue={onAddToQueue}
          isSearching={isSearching}
          searchQuery={searchQuery}
          searchError={searchError}
        />
      )}
    </div>
  );
}
