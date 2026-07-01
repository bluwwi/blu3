import { useRef, useEffect } from "react";
import { Track } from "@/utils/types";
import { Play, Pause, SkipBack, SkipForward, X } from "lucide-react";
import Icon from "@/hooks/useIcon";
import { ScrollArea } from "@/components/ui/ScrollArea";

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
  nextTrack?: Track | null;
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
  nextTrack,
}: ChatPanelProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden text-white w-full">
      {nextTrack ? (
        <div className="flex items-center gap-3 max-sm:px-2 sm:px-3 py-1 border-b border-white/10 bg-transparent">
          <img
            src={nextTrack.image || "https://via.placeholder.com/150"}
            alt="Next track cover"
            className=" h-12 w-12 rounded-md object-cover shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-white/70 uppercase tracking-wider font-semibold">
              Next up
            </p>
            <p className="text-[13px] flex items-end gap-1 font-semibold truncate text-white">
              {nextTrack.name}{" "}
              <span className="text-[13px] text-blue-200   truncate">
                {" by "}
                {nextTrack.artists?.[0]?.name || "Unknown Artist"}
              </span>
            </p>
          </div>
        </div>
      ) : track ? (
        <div className="flex items-center justify-between max-sm:p-0 sm:p-3 border-b border-white/10 bg-transparent">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src={track.image || "https://via.placeholder.com/150"}
              alt="Track cover"
              className="w-10 h-10 rounded-md object-cover shrink-0"
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
          <div className="flex items-center gap-1.5 shrink-0 pl-2">
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
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white hover:bg-white/80 transition-colors disabled:opacity-50 text-black"
            >
              {isPlaying ? (
                <Icon name="Pause" size={16} className="" />
              ) : (
                <Icon name="Play" size={16} className="" />
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
      ) : null}

      <div className="flex items-center justify-between max-sm:px-2 sm:px-4 max-sm:py-2 sm:py-3 border-b border-white/10 bg-transparent">
        <h2 className="text-lg font-bold w-20">Chat</h2>

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

        <div className="w-20 flex justify-end">
          <button
            onClick={onClose}
            className="p-1 text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1 max-sm:px-2 sm:px-4 max-sm:py-2 sm:py-3 flex flex-col gap-3">
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
      </ScrollArea>

      <div className="max-sm:p-2 sm:p-3 border-t border-white/10 bg-transparent">
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
            className="absolute right-1.5 bg-white  hover:bg-white disabled:opacity-50 disabled:hover:bg-white text-black text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
