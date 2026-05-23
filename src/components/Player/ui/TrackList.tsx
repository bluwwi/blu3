"use client";

import { Track } from "@/utils/types";
import { TrackItem } from "./TrackItem";

interface Props {
  tracks: Track[];
  activeTrackId: string | null;
  loadingTrackId: string | null;
  isPlaying: boolean;
  onTrackSelect?: (track: Track) => void;
  onAddToQueue?: (track: Track) => void;
  isSearching: boolean;
  searchQuery: string;
  searchError: string;
}

export function TrackList({
  tracks,
  activeTrackId,
  loadingTrackId,
  isPlaying,
  onTrackSelect,
  onAddToQueue,
  isSearching,
  searchQuery,
  searchError,
}: Props) {
  // Loading state
  if (isSearching) {
    return (
      <div className="space-y-0.5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2.5 animate-pulse"
          >
            <div className="w-12 h-12 rounded-lg bg-zinc-800" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-zinc-800 rounded w-3/4" />
              <div className="h-2 bg-zinc-800/50 rounded w-1/2" />
            </div>
            <div className="w-8 h-3 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (searchError) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
        <p className="text-red-400 text-xs">{searchError}</p>
      </div>
    );
  }

  // Empty state - no query
  if (!searchQuery && tracks.length === 0) {
    return (
      <div className="text-center py-16 space-y-2">
        <p className="text-5xl">♪</p>
        <p className="text-zinc-700 text-xs tracking-widest uppercase">
          Search via YouTube Music · Play via YouTube
        </p>
      </div>
    );
  }

  // Empty state - no results
  if (tracks.length === 0 && searchQuery) {
    return (
      <p className="text-zinc-700 text-sm text-center py-12">
        No results for "{searchQuery}"
      </p>
    );
  }

  // Results list
  return (
    <div className="space-y-0.5">
      {tracks.map((track, i) => (
        <TrackItem
          key={track.id}
          track={track}
          index={i}
          isActive={activeTrackId === track.id}
          isLoading={loadingTrackId === track.id}
          isPlaying={isPlaying}
          onClick={onTrackSelect ? () => onTrackSelect(track) : undefined}
          onAddToQueue={onAddToQueue}
        />
      ))}
    </div>
  );
}
