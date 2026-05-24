"use client";

import { T } from "@/utils/roomHelpers";
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
      <div style={{ display: "grid", gap: "2px" }}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 12px",
              animation: "pulse 1s ease-in-out infinite",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                background: T.surface3,
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  height: "12px",
                  width: "75%",
                  borderRadius: "999px",
                  background: T.surface3,
                  marginBottom: "8px",
                }}
              />
              <div
                style={{
                  height: "8px",
                  width: "50%",
                  borderRadius: "999px",
                  background: T.surface2,
                }}
              />
            </div>
            <div
              style={{
                width: "32px",
                height: "12px",
                borderRadius: "999px",
                background: T.surface3,
              }}
            />
          </div>
        ))}
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
      </div>
    );
  }

  // Error state
  if (searchError) {
    return (
      <div
        style={{
          background: "rgba(239,68,68,0.10)",
          border: "1px solid rgba(239,68,68,0.20)",
          borderRadius: "10px",
          padding: "12px 16px",
        }}
      >
        <p style={{ color: "#f87171", fontSize: "12px" }}>{searchError}</p>
      </div>
    );
  }

  // Empty state - no query
  if (!searchQuery && tracks.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "64px 0" }}>
        <p style={{ fontSize: "48px", marginBottom: "8px" }}>♪</p>
        <p
          style={{
            color: T.text3,
            fontSize: "11px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Search via YouTube Music · Play via YouTube
        </p>
      </div>
    );
  }

  // Empty state - no results
  if (tracks.length === 0 && searchQuery) {
    return (
      <p
        style={{
          color: T.text3,
          fontSize: "14px",
          textAlign: "center",
          padding: "48px 0",
        }}
      >
        No results for "{searchQuery}"
      </p>
    );
  }

  // Results list
  return (
    <div style={{ display: "grid", gap: "2px" }}>
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
