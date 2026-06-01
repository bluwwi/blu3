"use client";
import { useState, useEffect } from "react";
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

function AnimatedPortal({
  show,
  onClose,
  children,
}: {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [show]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: visible ? "rgba(0,0,0,0.60)" : "rgba(0,0,0,0)",
        backdropFilter: visible ? "blur(18px)" : "blur(0px)",
        WebkitBackdropFilter: visible ? "blur(18px)" : "blur(0px)",
        transition: "background 0.3s ease, backdrop-filter 0.3s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible
            ? "scale(1) translateY(0)"
            : "scale(0.94) translateY(16px)",
          transition:
            "opacity 0.3s cubic-bezier(0.34,1.56,0.64,1), transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
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
      <AnimatedPortal
        show={showMembersPopup}
        onClose={() => setShowMembersPopup(false)}
      >
        <div className="w-80 overflow-hidden" style={{ borderRadius: "24px" }}>
          {/* Header band */}
          <div
            className="px-5 pt-5 pb-4"
            style={{
              background: "rgba(255,255,255,0.06)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold text-[15px] leading-none">
                  In this room
                </h2>
                <p className="text-white/40 text-[11px] mt-1">
                  {members.length}{" "}
                  {members.length === 1 ? "listener" : "listeners"}
                </p>
              </div>
              <button
                onClick={() => setShowMembersPopup(false)}
                className="flex items-center justify-center h-7 w-7 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Member list */}
          <div
            className="px-3 py-3 max-h-64 overflow-y-auto room-scroll space-y-1"
            style={{
              background: "rgba(10,10,10,0.7)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            {members.map((m, i) => {
              const isMe = user?.sub === m.userId || user?.email === m.userId;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors hover:bg-white/[0.04]"
                  style={{
                    background: isMe ? "rgba(139,92,246,0.10)" : "transparent",
                  }}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {m.avatar ? (
                      <img
                        src={m.avatar}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                        style={{
                          border: isMe
                            ? "2px solid rgba(139,92,246,0.6)"
                            : "2px solid rgba(255,255,255,0.15)",
                        }}
                      />
                    ) : (
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                        style={{
                          background: isMe
                            ? "rgba(139,92,246,0.3)"
                            : "rgba(255,255,255,0.08)",
                          border: isMe
                            ? "2px solid rgba(139,92,246,0.5)"
                            : "2px solid rgba(255,255,255,0.12)",
                          color: isMe ? "#c4b5fd" : "rgba(255,255,255,0.6)",
                        }}
                      >
                        {m.name[0].toUpperCase()}
                      </div>
                    )}
                    {/* online dot */}
                    <span
                      className="absolute bottom-0 right-0 h-2 w-2 rounded-full"
                      style={{
                        background: "#22c55e",
                        border: "1.5px solid #0a0a0a",
                      }}
                    />
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-white/85 truncate leading-none">
                      {m.name}
                    </p>
                    {isMe && (
                      <p className="text-[10px] text-violet-400/70 mt-0.5">
                        you
                      </p>
                    )}
                  </div>

                  {/* Logout */}
                  {isMe && onLogout && (
                    <button
                      onClick={() => {
                        setShowMembersPopup(false);
                        onLogout();
                      }}
                      className="shrink-0 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/30 hover:text-red-400 hover:bg-white/8 transition-all"
                    >
                      <Icon name="logout" size={12} /> Logout
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </AnimatedPortal>

      {/* Leave popup */}
      <AnimatedPortal
        show={showLeavePopup}
        onClose={() => setShowLeavePopup(false)}
      >
        <div
          className="w-80 p-8 text-center"
          style={{
            background: "rgba(0,0,0,0.35)",
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <p className="text-white text-xl font-semibold leading-snug py-4">
            Are you sure you want to
            <br />
            leave this Room?
          </p>

          <button
            onClick={() => {
              setShowLeavePopup(false);
              onLeave?.();
            }}
            className="block w-full cursor-pointer py-3.5 mb-2 text-white text-[15px] font-semibold transition-all duration-200 hover:opacity-85"
            style={{ background: "#c0392b", borderRadius: "12px" }}
          >
            Yes, leave room
          </button>

          <button
            onClick={() => setShowLeavePopup(false)}
            className="block w-full py-3.5 cursor-pointer text-[15px] font-medium transition-all duration-200 hover:bg-white/90"
            style={{
              background: "#ffffff",
              color: "#1a1a1a",
              borderRadius: "12px",
            }}
          >
            Cancel
          </button>
        </div>
      </AnimatedPortal>
    </>
  );
}
