// components/Player/ui/RightSidebar.tsx  (replace existing)
"use client";
import { useState, useEffect, useRef } from "react";
import { Clock3, ListMusic, MessageSquare } from "lucide-react";
import { QueueAndHistory } from "./QueueAndHistory";
import { Track } from "@/utils/types";
import { RoomTheme, T } from "@/utils/roomHelpers";

type SideTab = "queue" | "history" | "chat";

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
  chatInput: string;
  setChatInput: (val: string) => void;
  handleSendChat: () => void;
  roomTheme: RoomTheme;
  onThemeChange: (theme: RoomTheme) => void;
  playerState?: string;
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
  chatInput,
  setChatInput,
  handleSendChat,
  playerState,
}: Props) {
  const [tab, setTab] = useState<SideTab>("queue");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (tab === "chat") chatInputRef.current?.focus();
  }, [tab, messages]);

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
        <p className="text-[9px] uppercase tracking-[0.2em] text-white/35 mb-2">
          {members.length} listening
        </p>
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
        <button
          className={tabBtn("chat", tab === "chat")}
          onClick={() => setTab("chat")}
        >
          <MessageSquare size={11} />
          Chat
          {tab === "chat" && (
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

        {/* Chat */}
        {tab === "chat" && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="room-scroll flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
              {messages.length === 0 && (
                <p className="text-[11px] text-white/35 text-center mt-8">
                  no messages yet
                </p>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2">
                  {msg.avatar ? (
                    <img
                      src={msg.avatar}
                      alt=""
                      className="h-5 w-5 rounded-full object-cover flex-shrink-0 mt-0.5"
                    />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-violet-400/20 flex items-center justify-center text-[8px] text-violet-300 flex-shrink-0 mt-0.5">
                      {msg.name[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-[9px] text-white/40 mr-1.5">
                      {msg.name.split(" ")[0]}
                    </span>
                    <span className="text-[11px] text-white/75">
                      {msg.text}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2 border-t border-white/10 p-2.5">
              <input
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="say something..."
                className="flex-1 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] text-white outline-none placeholder:text-white/35"
              />
              <button
                type="button"
                onClick={handleSendChat}
                className="h-8 w-8 rounded-full border border-white/15 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors text-sm flex items-center justify-center"
              >
                ↑
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
