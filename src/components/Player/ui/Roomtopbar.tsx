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
  const tabs = useMemo(
    () => [
      { id: "listen", label: "Listen Now", icon: Play },
      { id: "browse", label: "Browse", icon: LayoutGrid },
      { id: "radio", label: "Radio", icon: Radio },
      { id: "playlists", label: "Playlists", icon: Music },
    ],
    [],
  );
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>(
    "listen",
  );
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
    <div className="relative flex items-center justify-between gap-4">
      <div className="hidden items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white backdrop-blur-xl md:flex">
        <div
          className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-white/35"}`}
        />
        <span className="text-sm font-medium text-white">{roomName}</span>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/65">
          {roomCode}
        </span>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/65">
          {themeLabel}
        </span>
        {isHost && (
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] text-white">
            Host
          </span>
        )}
      </div>

      <div className="absolute left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 p-1.5 text-white shadow-2xl backdrop-blur-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-white/25 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-xl">
        <div className="hidden text-right md:block">
          <p className="max-w-[180px] truncate text-sm font-medium text-white">
            {track?.name ?? (activeVideoId ? "Playing from URL" : roomName)}
          </p>
          <p className="text-[11px] text-white/55">
            {statusLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onCopyInvite}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Copy invite"
        >
          <Share2 size={16} />
        </button>
        <button
          type="button"
          onClick={onLeave}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Leave room"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
