"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Music2 } from "lucide-react";
import { Track } from "@/utils/types";

interface ImportLinkPopupProps {
  isVisible: boolean;
  onClose: () => void;
  resolveLink: (url: string) => Promise<{
    videoId: string;
    name: string;
    artist: string;
    image: string;
    source: string;
  } | null>;
  addToQueue: (track: Track) => void;
}

export function ImportLinkPopup({
  isVisible,
  onClose,
  resolveLink,
  addToQueue,
}: ImportLinkPopupProps) {
  const [url, setUrl] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolvedTrack, setResolvedTrack] = useState<{
    videoId: string;
    name: string;
    artist: string;
    image: string;
    source: string;
  } | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setResolving(true);
    setError("");
    setResolvedTrack(null);
    try {
      const result = await resolveLink(url.trim());
      if (!result) {
        setError("Could not resolve this link. Try a different one.");
        return;
      }
      setResolvedTrack(result);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setResolving(false);
    }
  };

  const handleAddToQueue = () => {
    if (!resolvedTrack) return;
    const track: Track = {
      id: `import-${resolvedTrack.videoId}`,
      source: "youtube",
      videoId: resolvedTrack.videoId,
      name: resolvedTrack.name || "Imported track",
      duration_ms: 0,
      explicit: false,
      artists: [{ name: resolvedTrack.artist || "Unknown" }],
      album: { name: "" },
      image: resolvedTrack.image || "",
    };
    addToQueue(track);
    setUrl("");
    setResolvedTrack(null);
    onClose();
  };

  const handleClose = () => {
    setUrl("");
    setResolvedTrack(null);
    setError("");
    onClose();
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ease-in-out ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={handleClose}
    >
      <div
        className="w-[380px] p-5 flex flex-col border border-white/20 bg-black/55 backdrop-blur-3xl rounded-[24px]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-white text-lg font-semibold mb-4 text-center">
          Import from Link
        </p>

        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Paste YouTube / Spotify / Apple Music link"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 outline-none focus:border-white/30 placeholder:text-white/40"
            autoFocus
            disabled={resolving}
          />
          <button
            onClick={handleSubmit}
            disabled={resolving || !url.trim()}
            className="shrink-0 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer"
          >
            {resolving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Resolve"
            )}
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-400 mb-3 text-center">{error}</p>
        )}

        {resolvedTrack && (
          <div className="border border-white/10 rounded-xl bg-white/5 mb-4">
            <div className="flex items-center gap-3 px-3 py-3">
              <div className="relative aspect-square w-14 shrink-0 overflow-hidden rounded-lg bg-white/10">
                {resolvedTrack.image ? (
                  <img
                    src={resolvedTrack.image}
                    alt={resolvedTrack.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Music2 size={16} className="text-white/30" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/85 leading-tight">
                  {resolvedTrack.name}
                </p>
                <p className="truncate text-xs text-white/45 mt-0.5">
                  {resolvedTrack.artist}
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 p-2">
              <button
                onClick={handleAddToQueue}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-100 px-4 py-2.5 text-base font-medium text-black transition-all hover:bg-blue-200 cursor-pointer"
              >
                Add to queue
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleClose}
          className="w-full bg-[#c0392b] hover:bg-[#c0392b]/80 py-1.5 rounded-lg text-white text-[15px] font-semibold transition-all duration-500 cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>,
    document.body,
  );
}
