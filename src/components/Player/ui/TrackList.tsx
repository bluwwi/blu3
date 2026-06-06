"use client";

import { Disc3, SearchX } from "lucide-react";
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
      <div className="grid gap-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex animate-pulse items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
          >
            <div className="h-12 w-12 rounded-xl bg-white/10" />
            <div className="flex-1">
              <div className="mb-2 h-3 w-3/4 rounded-full bg-white/10" />
              <div className="h-2 w-1/2 rounded-full bg-white/5" />
            </div>
            <div className="h-3 w-8 rounded-full bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  if (searchError) {
    return (
      <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3">
        <p className="text-sm text-rose-200">{searchError}</p>
      </div>
    );
  }

  if (!searchQuery && tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[28px] border border-white/10 bg-white/5 px-6 py-14 text-center">
        <Disc3 size={34} className="mb-4 text-white/45" />
        <p className="text-xs uppercase tracking-[0.28em] text-white/55">
          Search via YouTube Music · Play via YouTube
        </p>
      </div>
    );
  }

  if (tracks.length === 0 && searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[28px] border border-white/10 bg-white/5 px-6 py-14 text-center">
        <SearchX size={34} className="mb-4 text-white/45" />
        <p className="text-sm text-white/65">No results for "{searchQuery}"</p>
      </div>
    );
  }

  return (
    <div className="grid gap-1.5">
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
