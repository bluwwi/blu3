"use client";
import { useState } from "react";
import { Track } from "@/utils/types";
import { RoomTheme } from "@/utils/roomHelpers";
import { Profile } from "@/components/Profile";

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
}: Props) {
  const [showLeavePopup, setShowLeavePopup] = useState(false);

  return (
    <>
      <div className="flex items-center border border-white/[0.08] mt-2 rounded-2xl justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2 bg-white/[0.05] backdrop-blur-2xl shadow-[0_4px_24px_-6px_rgba(0,0,0,0.4)] relative before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent">
        {/* Logo */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <img
            src="/logo/logow.svg"
            alt="Company Logo"
            width={50}
            height={50}
            className="object-contain"
          />
        </div>

        {/* Search bar */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSearchClick();
          }}
          className="flex-1 max-w-md flex items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.06] hover:bg-white/[0.1] px-3 sm:px-5 py-2 sm:py-2.5 transition-all text-left min-w-0"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-white/60 flex-shrink-0"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span className="flex-1 text-[13px] text-white/60 truncate">
            <span className="hidden sm:inline">
              What do you want to play next?
            </span>
            <span className="sm:hidden">Search next...</span>
          </span>
          <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md border border-white/[0.06] text-[10px] text-white/30">
            <kbd className="text-white/40">⌘</kbd>
            <kbd>K</kbd>
          </span>
        </button>

        {/* Right side */}
        <div
          className="flex items-center gap-2 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setShowLeavePopup(true)}
            className="flex items-center gap-1.5 rounded-full bg-white/[0.07] border border-white/[0.08] px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.12] hover:text-white transition-all"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-violet-400"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            {roomCode}
          </button>
          <Profile size="md" />
        </div>
      </div>

      {showLeavePopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setShowLeavePopup(false)}
        >
          <div
            className="w-[340px] p-8 text-center"
            style={{ background: "#1a1a1a", borderRadius: "24px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white text-xl font-semibold leading-snug mb-7">
              Are you sure you want to
              <br />
              leave this Room?
            </p>

            <button
              onClick={() => {
                setShowLeavePopup(false);
                onLeave();
              }}
              className="block w-full py-4 mb-2.5 text-white text-[15px] font-semibold transition-colors"
              style={{ background: "#c0392b", borderRadius: "12px" }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#a93226")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#c0392b")}
            >
              Yes, leave room
            </button>

            <button
              onClick={() => setShowLeavePopup(false)}
              className="block w-full py-4 text-[#1a1a1a] text-[15px] font-medium transition-colors"
              style={{ background: "#ffffff", borderRadius: "12px" }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#e8e8e8")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#ffffff")}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
