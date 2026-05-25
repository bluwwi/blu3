"use client";
import { useState } from "react";
import { Track } from "@/utils/types";
import { RoomTheme } from "@/utils/roomHelpers";
import { LogOut, X } from "lucide-react";
import Image from "next/image";

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
  onSearchClick: () => void;
}

export function RoomTopBar({
  roomCode,
  connected,
  onLeave,
  onSearchClick,
  user,
}: Props) {
  const [showLeavePopup, setShowLeavePopup] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-4 px-1 py-2">
        {/* Logo */}
        {/*<div className="flex items-center gap-1 flex-shrink-0">
          <Image
            src="/logo/logow.svg" // Path to file in public folder
            alt="Company Logo" // Required for accessibility
            width={50} // Required: Width in pixels
            height={50} // Required: Height in pixels
            className="object-contain" // Optional: Tailwind class for styling
            priority // Optional: Loads immediately (good for LCP logos)
          />
        </div>*/}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-3xl font-black text-white leading-none tracking-tight">
            Blu3
          </span>
        </div>

        {/* Search bar — only this triggers the overlay */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSearchClick();
          }}
          className="flex-1 max-w-md flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2.5 backdrop-blur-xl transition-colors hover:bg-white/12 text-left"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-white/50 flex-shrink-0"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span className="flex-1 text-[13px] text-white/40">
            What do you want to play next?
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-white/40 flex-shrink-0"
          >
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        </button>

        {/* Right side — stopPropagation on the whole section so clicks here never bubble */}
        <div
          className="flex items-center gap-2 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setShowLeavePopup(true)}
            className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[13px] font-medium text-white backdrop-blur-xl transition-colors hover:bg-white/15"
          >
            <div
              className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-white/35"}`}
            />
            {roomCode}
          </button>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
            H
          </div>
        </div>
      </div>

      {showLeavePopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowLeavePopup(false)}
        >
          <div
            className="w-72 rounded-[24px] border border-white/20 bg-slate-900/90 p-6 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-white font-semibold text-[15px]">
                Leave room?
              </h2>
              <button
                onClick={() => setShowLeavePopup(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-white/50 text-[12px] mb-5">
              You'll be taken back to browse. Others can still listen.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLeavePopup(false)}
                className="flex-1 rounded-full border border-white/20 bg-white/8 py-2.5 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/15 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLeavePopup(false);
                  onLeave();
                }}
                className="flex-1 rounded-full bg-red-500/80 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-red-500"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
