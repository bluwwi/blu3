"use client";
import { useState, useEffect, useRef } from "react";
import { Clock3, ListMusic, MessageSquare } from "lucide-react";
import { QueueAndHistory } from "./QueueAndHistory";
import { Track } from "@/utils/types";
import { RoomTheme, T } from "@/utils/roomHelpers";

type SideTab = "queue" | "history";

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
  clearQueue?: () => void;
  activeVideoId: string | null | undefined;
  roomTheme: RoomTheme;
  onThemeChange: (theme: RoomTheme) => void;
  playerState?: string;
  onChatToggle?: () => void;
  unreadChatCount?: number;
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
  clearQueue,
  activeVideoId,
  playerState,
  onChatToggle,
  unreadChatCount = 0,
}: Props) {
  const [tab, setTab] = useState<SideTab>("queue");

  const tabBtn = (t: SideTab, active: boolean) =>
    `flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-[10px] uppercase tracking-[0.15em] border-none bg-transparent cursor-pointer relative transition-colors rounded-t-lg ${
      active
        ? "text-white"
        : "text-white/40 hover:text-white/70 hover:bg-white/5"
    }`;

  return (
    <div className="flex h-full min-h-0 flex-col text-white overflow-hidden">
      {/* Members strip (always visible) */}
      <div className="px-4 pt-3 pb-2 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] uppercase tracking-[0.2em] text-white/35">
            {members.length} listening
          </p>
          {onChatToggle && (
            <button 
              onClick={onChatToggle}
              className="relative text-white/40 hover:text-white transition-colors"
            >
              <MessageSquare size={14} />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-violet-500 text-[8px] font-bold text-white px-0.5">
                  {unreadChatCount > 9 ? "9+" : unreadChatCount}
                </span>
              )}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {members.map((m, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-1"
            >
              {m.avatar ? (
                <img
                  src={m.avatar}
                  alt=""
                  className="h-4 w-4 rounded-full object-cover"
                />
              ) : (
                <div className="h-4 w-4 rounded-full bg-violet-400/25 flex items-center justify-center text-[8px] text-violet-300 font-semibold">
                  {m.name[0]}
                </div>
              )}
              <span className="text-[10px] text-white/70">
                {m.name.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 flex-shrink-0">
        <button
          className={tabBtn("queue", tab === "queue")}
          onClick={() => setTab("queue")}
        >
          <ListMusic size={11} />
          Queue
          <span className="text-[9px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded-full ml-0.5">
            {queue.length}
          </span>
          {tab === "queue" && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-violet-400 rounded-t" />
          )}
        </button>
        <button
          className={tabBtn("history", tab === "history")}
          onClick={() => setTab("history")}
        >
          <Clock3 size={11} />
          History
          {tab === "history" && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-violet-400 rounded-t" />
          )}
        </button>
      </div>

      {/* Panel body */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Queue and history share the same panel component */}
        {(tab === "queue" || tab === "history") && (
          <div className="flex-1 min-h-0 p-2">
            <QueueAndHistory
              queue={queue}
              recentTracks={recentTracks}
              canControlPlayback={canControlPlayback}
              handleAdminPlayTrack={handleAdminPlayTrack}
              removeFromQueue={removeFromQueue}
              addToQueue={addToQueue}
              clearQueue={clearQueue}
              activeVideoId={activeVideoId}
              defaultTab={tab}
              playerState={playerState}
            />
          </div>
        )}
      </div>
    </div>
  );
}
