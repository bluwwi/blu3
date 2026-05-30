import { useRef, useEffect } from "react";
import { Track } from "@/utils/types";
import { Play, Pause, SkipBack, SkipForward, X } from "lucide-react";
import Icon from "@/hooks/useIcon";

interface Message {
  id: string;
  name: string;
  text: string;
  avatar?: string;
}

interface ChatPanelProps {
  messages: Message[];
  chatInput: string;
  setChatInput: (val: string) => void;
  handleSendChat: () => void;
  onClose: () => void;
  track: Track | null;
  isPlaying: boolean;
  canControlPlayback: boolean;
  onPlayPause?: () => void;
  onSkipBack?: () => void;
  onSkipForward?: () => void;
  userProfile?: { name: string; avatar?: string } | null;
}

export function ChatPanel({
  messages,
  chatInput,
  setChatInput,
  handleSendChat,
  onClose,
  track,
  isPlaying,
  canControlPlayback,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  userProfile,
}: ChatPanelProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-transparent rounded-[20px] overflow-hidden text-white w-full">
      {/* Mini Player Header */}
      {track && (
        <div className="flex items-center justify-between max-md:p-0 md:p-3 border-b border-white/10 bg-transparent">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src={track.image || "https://via.placeholder.com/150"}
              alt="Track cover"
              className="w-10 h-10 rounded-md object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold truncate text-white">
                {track.name}
              </p>
              <p className="text-[11px] text-white/60 truncate">
                {track.artists?.[0]?.name || "Unknown Artist"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 pl-2">
            <button
              onClick={onSkipBack}
              disabled={!canControlPlayback}
              className="p-1.5 text-white/70 hover:text-white transition-colors disabled:opacity-50"
            >
              <SkipBack size={16} fill="currentColor" />
            </button>
            <button
              onClick={onPlayPause}
              disabled={!canControlPlayback}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white hover:bg-violet-400 transition-colors disabled:opacity-50 text-black"
            >
              {isPlaying ? (
                <Icon name="Pause" size={16} className="ml-0.5" />
              ) : (
                <Icon name="Play" size={16} className="ml-1" />
              )}
            </button>
            <button
              onClick={onSkipForward}
              disabled={!canControlPlayback}
              className="p-1.5 text-white/70 hover:text-white transition-colors disabled:opacity-50"
            >
              <SkipForward size={16} fill="currentColor" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between max-md:px-2 md:px-4 max-md:py-2 md:py-3 border-b border-white/10 bg-transparent">
        <h2 className="text-lg font-bold w-20">Chat</h2>

        {/* Center: Avatar */}
        <div className="flex-1 flex justify-center">
          {userProfile?.avatar ? (
            <img
              src={userProfile.avatar}
              alt=""
              className="w-7 h-7 rounded-full object-cover border border-orange-500"
            />
          ) : userProfile?.name ? (
            <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-xs font-semibold border border-orange-400">
              {userProfile.name.charAt(0).toUpperCase()}
            </div>
          ) : null}
        </div>

        {/* Right: Close Button */}
        <div className="w-20 flex justify-end">
          <button
            onClick={onClose}
            className="p-1 text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto max-md:px-2 md:px-4 max-md:py-2 md:py-3 flex flex-col gap-3 room-scroll">
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
                className="h-6 w-6 rounded-full object-cover flex-shrink-0 mt-0.5"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-violet-400/20 flex items-center justify-center text-[10px] text-violet-300 flex-shrink-0 mt-0.5 font-bold">
                {msg.name[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex gap-2 rounded-2xl rounded-tl-sm px-3 py-2 border border-white/5">
              <span className="text-[12px] text-white/50 block mb-0.5">
                {msg.name.split(" ")[0]}
              </span>
              <span className="text-[12px] text-white wrap-break-words">
                {msg.text}
              </span>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
      <div className="max-md:p-2 md:p-3 border-t border-white/10 bg-transparent">
        <div className="relative flex items-center">
          <div className="absolute left-3 text-white/40 flex items-center gap-2">
            <div className="w-6 h-5 border border-white/40 rounded flex items-center justify-center text-[8px] font-bold">
              GIF
            </div>
          </div>
          <input
            ref={chatInputRef}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
            placeholder="Send Message"
            className="w-full bg-transparent border border-white/20 rounded-xl pl-12 pr-20 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
          />
          <button
            onClick={handleSendChat}
            disabled={!chatInput.trim()}
            className="absolute right-1.5 bg-[#8C52FF] hover:bg-violet-400 disabled:opacity-50 disabled:hover:bg-[#8C52FF] text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
