"use client";
import { useState } from "react";
import { Track } from "@/utils/types";
import { RoomTheme } from "@/utils/roomHelpers";
import { LogOut, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
  const { user, loading: authLoading, login, logout } = useAuth();
  const [showLeavePopup, setShowLeavePopup] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <>
      <div className="flex items-center border border-white/[0.08] mt-2 rounded-2xl justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2 bg-white/[0.05] backdrop-blur-2xl shadow-[0_4px_24px_-6px_rgba(0,0,0,0.4)] relative overflow-hidden before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent">
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
        {/*<div className="flex items-center gap-1 shrink-0">
          <span className="text-3xl font-black text-white leading-none tracking-tight">
            Blu3
          </span>
        </div>*/}

        {/* Search bar — only this triggers the overlay */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSearchClick();
          }}
          className="flex-1 max-w-md flex items-center gap-3 rounded-full border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.06] px-3 sm:px-4 py-2 sm:py-2.5 transition-all text-left min-w-0 focus-within:border-white/30"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-white flex-shrink-0"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span className="flex-1 text-[13px] text-white/80 truncate">
            <span className="hidden sm:inline">What do you want to play next?</span>
            <span className="sm:hidden">Search next...</span>
          </span>
        </button>

        {/* Right side — stopPropagation on the whole section so clicks here never bubble */}
        <div
          className="flex items-center gap-2 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setShowLeavePopup(true)}
            className="flex items-center gap-1.5 rounded-full border border-white/30  px-4 py-2 text-base font-medium text-white cursor-pointer transition-colors "
          >
            {roomCode}
          </button>
          {user ? (
            <div className="relative">
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt=""
                  className="w-9 h-9 rounded-full border border-zinc-700 object-cover hover:border-zinc-500 transition-colors cursor-pointer"
                />
              )}
            </div>
          ) : (
            <button
              onClick={login}
              className="text-[11px] border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-400 hover:border-zinc-500 transition-colors tracking-widest uppercase"
            >
              sign in
            </button>
          )}
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
