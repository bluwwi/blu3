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
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = window.location.origin + "/room/" + roomCode;
    if (navigator.share) {
      navigator.share({ url }).catch(() => {});
    } else {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {});
    }
  };

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

              <div className="flex items-center gap-0">
                {roomCode && (
                  <>
                    <button
                      onClick={handleShare}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
                      title={copied ? "Copied!" : "Share invite link"}
                    >
                      <Icon
                        name="share"
                        size={20}
                        className={copied ? "text-green-400" : "text-current"}
                      />
                    </button>
                    <button
                      onClick={() => setShowLeavePopup(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-white text-black px-3 py-1.5 text-sm font-semibold hover:bg-white/80 transition-all cursor-pointer"
                      title="Room options"
                    >
                      Rooms
                    </button>
                  </>
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

      {showLeavePopup &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setShowLeavePopup(false)}
          >
            <div
              className="w-80 p-4 text-center border border-white/30"
              style={{
                background: "rgba(0,0,0,0.35)",
                backdropFilter: "blur(6px)",
                borderRadius: "24px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-white text-xl font-semibold leading-snug py-6">
                Are you sure you want to
                <br />
                leave this Room?
              </p>

              <button
                onClick={() => {
                  setShowLeavePopup(false);
                  onLeave?.();
                }}
                className="block w-full cursor-pointer py-1.5 mb-2 text-white text-[15px] font-semibold transition-all duration-500"
                style={{ background: "#c0392b", borderRadius: "12px" }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#a93226")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#c0392b")
                }
              >
                Yes, leave room
              </button>

              <button
                onClick={() => setShowLeavePopup(false)}
                className="block w-full py-1.5 cursor-pointer text-[#1a1a1a] text-[15px] font-medium transition-all duration-500"
                style={{ background: "#ffffff", borderRadius: "12px" }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#e8e8e8")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#ffffff")
                }
              >
                Cancel
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
