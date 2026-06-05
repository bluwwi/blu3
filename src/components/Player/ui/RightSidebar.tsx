"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { QueueAndHistory } from "./QueueAndHistory";
import { Track } from "@/utils/types";
import { RoomTheme, getRoomThemeVars } from "@/utils/roomHelpers";
import { Icon } from "@/hooks/useIcon";
import { X } from "lucide-react";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { log } from "console";

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
  user?: { id: string; email: string; name: string; image?: string | null; avatar?: string | null } | null;
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
  const [isMembersVisible, setIsMembersVisible] = useState(false);

  const [showLeavePopup, setShowLeavePopup] = useState(false);
  const [isLeaveVisible, setIsLeaveVisible] = useState(false);

  // Fade-in / Fade-out handlers
  const openMembers = () => {
    setShowMembersPopup(true);
    requestAnimationFrame(() => setIsMembersVisible(true));
  };
  const closeMembers = () => {
    setIsMembersVisible(false);
    setTimeout(() => setShowMembersPopup(false), 200);
  };

  const openLeave = () => {
    setShowLeavePopup(true);
    requestAnimationFrame(() => setIsLeaveVisible(true));
  };
  const closeLeave = () => {
    setIsLeaveVisible(false);
    setTimeout(() => setShowLeavePopup(false), 200);
  };

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
  const [copied, setCopied] = useState(false);

  return (
    <>
      <div
        className="flex h-full min-h-0 flex-col text-white"
        style={getRoomThemeVars(roomTheme)}
      >
        <div className="flex h-full min-h-0 flex-col text-white overflow-hidden">
          <div className=" px-3 max-md:pt-0 md:pt-3 pb-2  shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center">
                <button
                  onClick={openMembers}
                  className="flex flex-wrap -space-x-2 cursor-pointer"
                >
                  {members.map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center rounded-full border border-white/50 h-6 w-6"
                    >
                      {m.avatar ? (
                        <img
                          src={m.avatar}
                          alt="hello"
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
                      onClick={openLeave}
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
                userName={user?.name}
              />
            </div>
          </div>
        </div>
      </div>

      {showMembersPopup &&
        createPortal(
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ease-in-out ${isMembersVisible ? "opacity-100" : "opacity-0"}`}
            onClick={closeMembers}
          >
            <div
              className="w-72 md:w-96 rounded-3xl border border-white/30 py-3 px-4 backdrop-blur-3xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]"
              style={{
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold text-lg">
                  Members({members.length})
                </h2>
              </div>
              <ScrollArea className="max-h-60 space-y-2">
                {members.map((m, i) => {
                  const isMe =
                    user?.id === m.userId || user?.email === m.userId;
                  return (
                    <div key={i} className="flex items-center gap-3 rounded-xl">
                      <div className="flex items-center rounded-full border-2 border-white/30 shrink-0">
                        {m.avatar ? (
                          <img
                            src={m.avatar}
                            alt=""
                            className="h-9 w-9 aspect-square rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-violet-400/25 flex items-center justify-center text-[9px] text-violet-300 font-semibold">
                            {m.name[0]}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-white/95 font-medium truncate flex-1">
                          {m.name}
                          {isMe && (
                            <span className="text-xs text-white ml-1">
                              (you)
                            </span>
                          )}
                        </span>
                      </div>

                      {/*{isMe && onLogout && (
                        <button
                          onClick={() => {
                            closeMembers();
                            setTimeout(onLogout, 200);
                          }}
                          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white bg-red-600 transition-all shrink-0"
                        >
                          Logout
                        </button>
                      )}*/}
                    </div>
                  );
                })}
              </ScrollArea>
            </div>
          </div>,
          document.body,
        )}

      {showLeavePopup &&
        createPortal(
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ease-in-out ${isLeaveVisible ? "opacity-100" : "opacity-0"}`}
            onClick={closeLeave}
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
                  closeLeave();
                  setTimeout(() => onLeave?.(), 200);
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
                onClick={closeLeave}
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
