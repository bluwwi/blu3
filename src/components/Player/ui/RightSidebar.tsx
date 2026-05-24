"use client";

import { useEffect, useRef } from "react";
import { RoomTheme, T } from "@/utils/roomHelpers";

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
  roomTheme: RoomTheme;
  onThemeChange: (theme: RoomTheme) => void;
  chatInput: string;
  setChatInput: (val: string) => void;
  handleSendChat: () => void;
  chatOpen: boolean;
}

export function RightSidebar({
  members,
  messages,
  roomTheme,
  onThemeChange,
  chatInput,
  setChatInput,
  handleSendChat,
  chatOpen,
}: Props) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const themeOptions: Array<{ id: RoomTheme; label: string }> = [
    { id: "purple", label: "Lilac" },
    { id: "mono", label: "Mono" },
    { id: "yellow", label: "Gold" },
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (chatOpen) chatInputRef.current?.focus();
  }, [chatOpen, messages]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 text-white">
      <div className="space-y-3">
        <div className="flex gap-1.5">
          {themeOptions.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => onThemeChange(theme.id)}
              className={`flex-1 rounded-full border px-2.5 py-1.5 text-[9px] uppercase tracking-[0.16em] transition-colors ${
                roomTheme === theme.id
                  ? "border-white/30 bg-white/20 text-white"
                  : "border-white/15 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {theme.label}
            </button>
          ))}
        </div>

        <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">
          {members.length} listening
        </p>
        <div className="flex flex-wrap gap-1.5">
          {members.map((member) => (
            <div
              key={member.userId}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-1"
            >
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt=""
                  className="h-5 w-5 rounded-full border border-white/10 object-cover"
                />
              ) : (
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[9px] text-white/80"
                >
                  {member.name[0]}
                </div>
              )}
              <span className="text-[10px] text-white/80">
                {member.name.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-white/10 bg-white/5">
        <div className="border-b border-white/10 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">
            Room Chat
          </p>
        </div>

        <div className="room-scroll flex-1 overflow-y-auto px-3 py-2.5">
          {messages.length === 0 && (
            <p
              style={{
                fontSize: "11px",
                color: T.text3,
                textAlign: "center",
                marginTop: "30px",
              }}
            >
              no messages yet
            </p>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className="mb-2.5 flex items-start gap-2">
              {msg.avatar ? (
                <img
                  src={msg.avatar}
                  alt=""
                  className="mt-[1px] h-4.5 w-4.5 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: T.surface3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "8px",
                    color: T.text3,
                    flexShrink: 0,
                  }}
                >
                  {msg.name[0]}
                </div>
              )}
              <div className="min-w-0">
                <span
                  style={{
                    fontSize: "9px",
                    color: T.text3,
                    marginRight: "6px",
                  }}
                >
                  {msg.name.split(" ")[0]}
                </span>
                <span style={{ fontSize: "10px", color: T.text2 }}>
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
            className="flex-1 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] text-white outline-none placeholder:text-white/40"
          />
          <button
            type="button"
            onClick={handleSendChat}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            ↑
          </button>
        </div>
      </section>
    </div>
  );
}
