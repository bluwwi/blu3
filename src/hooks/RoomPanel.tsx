"use client";
import { useState, useRef, useEffect } from "react";
import { useRoom } from "@/hooks/useRoom";
import { useRoomSocket, ChatMessage, Member } from "@/hooks/useRoomSocket";

interface RoomPanelProps {
  onPlaybackPlay?: (state: any) => void;
  onPlaybackPause?: (t: number) => void;
  onPlaybackSeek?: (t: number) => void;
}

export function RoomPanel({
  onPlaybackPlay,
  onPlaybackPause,
  onPlaybackSeek,
}: RoomPanelProps) {
  const [view, setView] = useState<"lobby" | "room">("lobby");
  const [roomName, setRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { room, loading, error, createRoom, joinRoom, leaveRoom } = useRoom();

  const { connected, isHost, members, messages, sendChat } = useRoomSocket({
    roomCode: room?.code ?? null,
    onPlaybackPlay,
    onPlaybackPause,
    onPlaybackSeek,
  });

  useEffect(() => {
    if (room) setView("room");
  }, [room]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCreate = async () => {
    if (!roomName.trim()) return;
    await createRoom(roomName.trim());
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    await joinRoom(joinCode.trim().toUpperCase());
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendChat(chatInput.trim());
    setChatInput("");
  };

  const shareLink = room ? `${window.location.origin}/room/${room.code}` : "";

  if (view === "lobby") {
    return (
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <p className="text-xs text-zinc-500 tracking-widest uppercase">
          listen together
        </p>

        {/* Create */}
        <div className="space-y-2">
          <input
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="room name..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
          />
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-2 rounded-lg bg-white text-black text-xs font-medium tracking-widest uppercase hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? "creating..." : "＋ create room"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-xs text-zinc-600">or</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Join */}
        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="ROOM CODE"
            maxLength={6}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 uppercase tracking-widest"
          />
          <button
            onClick={handleJoin}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-zinc-700 text-xs text-zinc-300 hover:border-zinc-400 transition-colors disabled:opacity-50 tracking-widest uppercase"
          >
            join
          </button>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-400" : "bg-zinc-600"}`}
          />
          <span className="text-xs text-zinc-300 font-medium tracking-wide">
            {room?.name}
          </span>
          <span className="text-xs text-zinc-600 tracking-widest">
            {room?.code}
          </span>
          {isHost && (
            <span className="text-[10px] text-zinc-500 border border-zinc-700 rounded px-1.5 py-0.5 tracking-widest uppercase">
              host
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Copy invite link */}
          <button
            onClick={() => navigator.clipboard.writeText(shareLink)}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 rounded px-2 py-1 tracking-widest uppercase transition-colors"
          >
            copy link
          </button>
          <button
            onClick={() => {
              leaveRoom();
              setView("lobby");
            }}
            className="text-[10px] text-zinc-600 hover:text-red-400 transition-colors tracking-widest uppercase"
          >
            leave
          </button>
        </div>
      </div>

      {/* Members */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800/50">
        {members.map((m) => (
          <div key={m.userId} title={m.name}>
            {m.avatar ? (
              <img
                src={m.avatar}
                className="w-6 h-6 rounded-full border border-zinc-700"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] text-zinc-400">
                {m.name[0]}
              </div>
            )}
          </div>
        ))}
        <span className="text-xs text-zinc-600">
          {members.length} listening
        </span>
      </div>

      {/* Chat */}
      <div className="h-48 overflow-y-auto px-4 py-2 space-y-2 scrollbar-none">
        {messages.length === 0 && (
          <p className="text-xs text-zinc-700 text-center mt-8 tracking-wide">
            no messages yet
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-2">
            {msg.avatar ? (
              <img
                src={msg.avatar}
                className="w-5 h-5 rounded-full mt-0.5 flex-shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] flex-shrink-0">
                {msg.name[0]}
              </div>
            )}
            <div>
              <span className="text-[10px] text-zinc-500 mr-1.5">
                {msg.name.split(" ")[0]}
              </span>
              <span className="text-xs text-zinc-300">{msg.text}</span>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Chat input */}
      <div className="flex gap-2 px-3 py-3 border-t border-zinc-800">
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
          placeholder="say something..."
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
        />
        <button
          onClick={handleSendChat}
          className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs text-zinc-300 transition-colors"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
