"use client";
import { useState } from "react";
import { QueueAndHistory } from "./QueueAndHistory";
import { MembersPopup } from "./MembersPopup";
import { LeavePopup } from "./LeavePopup";
import { SharePopup } from "./SharePopup";
import { ImportLinkPopup } from "./ImportLinkPopup";
import { Track } from "@/utils/types";
import { RoomTheme, getRoomThemeVars } from "@/utils/roomHelpers";
import { Icon } from "@/hooks/useIcon";

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
  user?: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    avatar?: string | null;
  } | null;
  onLogout?: () => void;
  onLeave?: () => void;
  roomCode?: string;
  resolveLink: (url: string) => Promise<{
    videoId: string;
    name: string;
    artist: string;
    image: string;
    source: string;
  } | null>;
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
  resolveLink,
}: Props) {
  const [showMembersPopup, setShowMembersPopup] = useState(false);
  const [isMembersVisible, setIsMembersVisible] = useState(false);

  const [showLeavePopup, setShowLeavePopup] = useState(false);
  const [isLeaveVisible, setIsLeaveVisible] = useState(false);

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

  const [showSharePopup, setShowSharePopup] = useState(false);
  const [isShareVisible, setIsShareVisible] = useState(false);

  const handleLeaveConfirm = () => {
    closeLeave();
    setTimeout(() => onLeave?.(), 200);
  };

  const openShare = () => {
    setShowSharePopup(true);
    requestAnimationFrame(() => setIsShareVisible(true));
  };
  const closeShare = () => {
    setIsShareVisible(false);
    setTimeout(() => setShowSharePopup(false), 200);
  };

  const [showImportPopup, setShowImportPopup] = useState(false);
  const [isImportVisible, setIsImportVisible] = useState(false);

  const openImport = () => {
    setShowImportPopup(true);
    requestAnimationFrame(() => setIsImportVisible(true));
  };
  const closeImport = () => {
    setIsImportVisible(false);
    setTimeout(() => setShowImportPopup(false), 200);
  };

  return (
    <>
      <div
        className="flex h-full min-h-0 flex-col text-white"
        style={getRoomThemeVars(roomTheme)}
      >
        <div className="flex h-full min-h-0 flex-col text-white overflow-hidden">
          <div className=" px-3 max-sm:pt-0 sm:pt-3 pb-2  shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center">
                <button
                  onClick={openMembers}
                  className="flex  -space-x-3 cursor-pointer"
                >
                  {members.map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center rounded-full   h-6 w-6"
                    >
                      {m.avatar ? (
                        <img
                          src={m.avatar}
                          alt="hello"
                          className="h-6 w-6 aspect-square rounded-full border border-white/30 object-cover"
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
                      onClick={openShare}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
                      title="Share invite link"
                    >
                      <Icon name="share" size={20} className="text-current" />
                    </button>
                    {/*<button
                      onClick={openImport}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
                      title="Import link (YouTube, Spotify, Apple Music)"
                    >
                      <Icon name="link" size={20} className="text-current" />
                    </button>*/}
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

      {showMembersPopup && (
        <MembersPopup
          members={members}
          isVisible={isMembersVisible}
          onClose={closeMembers}
          userId={user?.id}
        />
      )}

      {showLeavePopup && (
        <LeavePopup
          isVisible={isLeaveVisible}
          onConfirm={handleLeaveConfirm}
          onCancel={closeLeave}
        />
      )}

      {showSharePopup && (
        <SharePopup
          isVisible={isShareVisible}
          roomCode={roomCode}
          onClose={closeShare}
        />
      )}

      {showImportPopup && (
        <ImportLinkPopup
          isVisible={isImportVisible}
          onClose={closeImport}
          resolveLink={resolveLink}
          addToQueue={addToQueue}
        />
      )}
    </>
  );
}
