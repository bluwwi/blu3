"use client";

import { Track } from "@/utils/types";
import { extractVideoId } from "@/utils/videoId";

interface Props {
  onPlay: (track: Track) => void;
  isLoading: boolean;
  error: string | null;
  className?: string;
}

export function UrlTab({ onPlay, isLoading, error, className = "" }: Props) {
  const handlePlay = (urlInput: string) => {
    const vid = extractVideoId(urlInput.trim());
    if (!vid) {
      return;
    }

    // Create minimal track object for URL play
    const track: Track = {
      id: `url-${vid}`,
      videoId: vid,
      name: "Playing from URL",
      duration_ms: 0,
      explicit: false,
      artists: [{ name: "Unknown" }],
      album: { name: "YouTube" },
      image: "",
    };
    onPlay(track);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex gap-2">
        <input
          type="text"
          id="url-input"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const input = (e.target as HTMLInputElement).value;
              handlePlay(input);
            }
          }}
          placeholder="Paste YouTube URL or video ID…"
          className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-green-500 text-white text-sm px-4 py-3 rounded-xl outline-none transition-colors placeholder:text-zinc-700"
          autoFocus
        />
        <button
          onClick={() => {
            const input = (
              document.getElementById("url-input") as HTMLInputElement
            )?.value;
            if (input) handlePlay(input);
          }}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-500 active:scale-95 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-xs font-bold tracking-widest transition-all uppercase"
        >
          {isLoading ? "⋯" : "Play"}
        </button>
      </div>

      {error && <p className="text-red-400 text-xs pl-1">{error}</p>}
      <p className="text-zinc-800 text-xs pl-1">
        Supports: youtube.com/watch?v=… · youtu.be/… · raw video ID
      </p>
    </div>
  );
}
