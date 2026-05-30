"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { QueueAndHistory } from "./QueueAndHistory";
import { Track } from "@/utils/types";
import { RoomTheme, getRoomThemeVars } from "@/utils/roomHelpers";
import { Icon } from "@/hooks/useIcon";
import { MessageCircle, X } from "lucide-react";

interface Member {
  userId: string;
  name: string;
  avatar?: string;
}
interface Message {
  id: string;
  name: string;
  text: string;
  avatar?: string;
}

interface Props {
  members: Member[];
  messages: Message[];
  queue: Track[];
  recentTracks: Array<{
    videoId: string;
    trackName: string;
    artistName: string;
    image: string;
    playedAt: number;
  }>;
  canControlPlayback: boolean;
  handleAdminPlayTrack: (track: Track) => void;
  removeFromQueue: (id: string) => void;
  addToQueue: (track: Track) => void;
  activeVideoId: string | null | undefined;
  roomTheme: RoomTheme;
  onThemeChange: (theme: RoomTheme) => void;
  playerState?: string;
  shuffleEnabled?: boolean;
  repeatMode?: "off" | "all" | "one";
  onToggleShuffle?: () => void;
  onCycleRepeat?: () => void;
  onChatToggle?: () => void;
  unreadChatCount?: number;
  onSearchClick?: () => void;
  clearQueue?: () => void;
  user?: { sub: string; email: string; name: string; avatar?: string } | null;
  onLogout?: () => void;
  onLeave?: () => void;
  roomCode?: string;
}

export function RightSidebar({
  members,
  messages,
  queue,
  recentTracks,
  canControlPlayback,
  handleAdminPlayTrack,
  removeFromQueue,
  addToQueue,
  activeVideoId,
  playerState,
  roomTheme = "purple",
  onThemeChange,
  shuffleEnabled = false,
  repeatMode = "off",
  onToggleShuffle,
  onCycleRepeat,
  onChatToggle,
  unreadChatCount = 0,
  onSearchClick,
  clearQueue,
  user,
  onLogout,
  onLeave,
  roomCode,
}: Props) {
  const [showMembersPopup, setShowMembersPopup] = useState(false);
  const [showLeavePopup, setShowLeavePopup] = useState(false);

  return (
    <>
      <div
        className="flex h-full min-h-0 flex-col text-white"
        style={getRoomThemeVars(roomTheme)}
      >
        <div className="flex h-full min-h-0 flex-col text-white overflow-hidden">
          {/* Header */}
          <div className="max-md:px-0 px-3 max-md:pt-0 md:pt-3 pb-2 border-b border-white/10 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center">
                <button
                  onClick={() => setShowMembersPopup(true)}
                  className="flex flex-wrap -space-x-2 cursor-pointer"
                >
                  {members.map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center rounded-full border border-white/50 aspect-square"
                    >
                      {m.avatar ? (
                        <img
                          src={m.avatar}
                          alt=""
                          className="h-5 w-5 aspect-square rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-4 w-4 aspect-square rounded-full bg-violet-400/25 flex items-center justify-center text-[8px] text-violet-300 font-semibold">
                          {m.name[0]}
                        </div>
                      )}
                    </div>
                  ))}
                </button>

                {onChatToggle && (
                  <button
                    onClick={onChatToggle}
                    className="relative flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
                    title="Toggle chat"
                  >
                    <Icon name="Chat" size={20} className="text-current" />
                    {unreadChatCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-violet-500 text-[8px] font-bold text-white px-0.5">
                        {unreadChatCount > 9 ? "9+" : unreadChatCount}
                      </span>
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {roomCode && (
                  <button
                    onClick={() => setShowLeavePopup(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-white text-black px-3 py-1.5 text-sm font-semibold hover:bg-white/80 transition-all cursor-pointer"
                    title="Room options"
                  >
                    Rooms
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Panel body */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0">
              <QueueAndHistory
                queue={queue}
                recentTracks={recentTracks}
                canControlPlayback={canControlPlayback}
                handleAdminPlayTrack={handleAdminPlayTrack}
                removeFromQueue={removeFromQueue}
                addToQueue={addToQueue}
                activeVideoId={activeVideoId}
                playerState={playerState}
                shuffleEnabled={shuffleEnabled}
                repeatMode={repeatMode}
                onToggleShuffle={onToggleShuffle}
                onCycleRepeat={onCycleRepeat}
                onSearchClick={onSearchClick}
                clearQueue={clearQueue}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Members popup */}
      {showMembersPopup &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowMembersPopup(false)}
          >
            <div
              className="w-72 rounded-[24px] border border-white/[0.12] bg-neutral-900/95 p-5 backdrop-blur-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold text-[15px]">
                  Members ({members.length})
                </h2>
                <button
                  onClick={() => setShowMembersPopup(false)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto room-scroll space-y-1">
                {members.map((m, i) => {
                  const isMe =
                    user?.sub === m.userId || user?.email === m.userId;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/[0.04]"
                    >
                      <div className="flex items-center rounded-full border-2 border-white/30 shrink-0">
                        {m.avatar ? (
                          <img
                            src={m.avatar}
                            alt=""
                            className="h-7 w-7 aspect-square rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-violet-400/25 flex items-center justify-center text-[9px] text-violet-300 font-semibold">
                            {m.name[0]}
                          </div>
                        )}
                      </div>
                      <span className="text-[12px] text-white/80 font-medium truncate flex-1">
                        {m.name}
                        {isMe && (
                          <span className="text-[9px] text-white/40 ml-1.5">
                            (you)
                          </span>
                        )}
                      </span>
                      {isMe && onLogout && (
                        <button
                          onClick={() => {
                            setShowMembersPopup(false);
                            onLogout();
                          }}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/50 hover:text-red-400 hover:bg-white/10 transition-all shrink-0"
                        >
                          <Icon name="logout" size={12} /> Logout
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Leave room popup */}
      {showLeavePopup &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            }}
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
                    onLeave?.();
                  }}
                  className="flex-1 rounded-full bg-red-500/80 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-red-500"
                >
                  Leave
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
