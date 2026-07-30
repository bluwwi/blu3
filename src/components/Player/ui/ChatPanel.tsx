import { useRef, useEffect, useState } from "react";
import { Track } from "@/utils/types";
import { Play, Pause, SkipBack, SkipForward, X, Smile } from "lucide-react";
import Icon from "@/hooks/useIcon";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { GifPicker } from "./GifPicker";

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
  sendGif?: (gifUrl: string) => void;
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
  sendGif,
}: ChatPanelProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [gifPickerOpen, setGifPickerOpen] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col border-t border-white/10 h-full bg-transparent overflow-hidden text-white w-full">
      <div className="flex items-center justify-between max-sm:px-2 sm:px-4 max-sm:py-2 sm:py-3 border-b border-white/10 bg-transparent">
        <h2 className="text-lg font-bold w-20">Chat</h2>

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
          <p className="text-9xl text-white/35 select-none text-center mt-8">
            {"..."}
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
              <div className="h-6 w-6 rounded-full bg-violet-400/20 flex items-center justify-center text-[10px] text-violet-300 shrink-0 mt-0.5 font-bold">
                {msg.name[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex gap-2 rounded-2xl rounded-tl-sm px-3 py-2 border border-white/5">
              <span className="text-[12px] text-white/50 block mb-0.5">
                {msg.name.split(" ")[0]}
              </span>
              {msg.text.match(/^\/gifs\/.+\.gif$/) ? (
                <img
                  src={msg.text}
                  alt="gif"
                  className="w-40 h-40 object-cover rounded-lg"
                />
              ) : (
                <span className="text-[12px] text-white wrap-break-words">
                  {msg.text}
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </ScrollArea>

      <div className="max-sm:p-2 sm:p-3 border-t border-white/10 bg-transparent">
        <div className="relative flex items-center">
          <div className="absolute left-3  flex items-center gap-2">
            <button
              onClick={() => setGifPickerOpen(true)}
              className="w-6.5 select-none cursor-pointer h-5  text-black hover:opacity-100 opacity-50   border-2 border-white rounded flex transition-all duration-300 bg-white  items-center justify-center text-[10.5px] font-bold"
            >
              GIF
            </button>
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
            className="absolute right-1.5 bg-white hover:bg-white disabled:opacity-50 disabled:hover:bg-white text-black text-xs font-semibold px-4 py-1.5 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>

      <GifPicker
        isVisible={gifPickerOpen}
        onClose={() => setGifPickerOpen(false)}
        onSelect={(gifUrl) => {
          if (sendGif) {
            sendGif(gifUrl);
          } else {
            setChatInput(gifUrl);
          }
        }}
      />
    </div>
  );
}
