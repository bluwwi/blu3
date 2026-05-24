"use client";

import { useMemo, useState } from "react";
import { Track } from "@/utils/types";
import { LayoutGrid, LogOut, Music, Play, Radio, Share2 } from "lucide-react";
import { RoomTheme } from "@/utils/roomHelpers";

interface Props {
  roomName: string;
  roomCode: string;
  isHost: boolean;
  connected: boolean;
  track: Track | null;
  roomTheme: RoomTheme;
  activeVideoId: string | null;
  playerState: "idle" | "loading" | "playing" | "paused" | "ended" | "error";
  onCopyInvite: () => void;
  onLeave: () => void;
}

export function RoomTopBar({
  roomName,
  roomCode,
  isHost,
  connected,
  track,
  roomTheme,
  activeVideoId,
  playerState,
  onCopyInvite,
  onLeave,
}: Props) {
  const themeLabel =
    roomTheme === "purple" ? "Lilac" : roomTheme === "mono" ? "Mono" : "Gold";
  const statusLabel =
    playerState === "playing"
      ? "Playing"
      : playerState === "loading"
        ? "Buffering"
        : activeVideoId || track
          ? "Paused"
          : "Idle";

  return (
    <div className="relative flex items-center justify-between gap-3">
      <div className="hidden items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-white backdrop-blur-xl md:flex">
        <div
          className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-white/35"}`}
        />
        <span className="text-xs font-medium text-white">{roomName}</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/65">
          {roomCode}
        </span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/65">
          {themeLabel}
        </span>
        {isHost && (
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] text-white">
            Host
          </span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1.5 text-white backdrop-blur-xl">
        <div className="hidden text-right md:block">
          <p className="max-w-[160px] truncate text-xs font-medium text-white">
            {track?.name ?? (activeVideoId ? "Playing from URL" : roomName)}
          </p>
          <p className="text-[10px] text-white/55">{statusLabel}</p>
        </div>
        <button
          type="button"
          onClick={onCopyInvite}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Copy invite"
        >
          <Share2 size={14} />
        </button>
        <button
          type="button"
          onClick={onLeave}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Leave room"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}
