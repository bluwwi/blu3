"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Plus, Music2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Icon } from "@/hooks/useIcon";
import { ImportStatus } from "./ImportToast";
import { PlaylistIcon, Link as LinkIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { Track } from "@/utils/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface PlaylistInfo {
  id: string;
  name: string;
  isLiked: boolean;
  createdAt: string;
  coverImage?: string;
  trackCount?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onQueuePlaylist: (playlistId: string) => Promise<void>;
  onImportStatus: (status: ImportStatus) => void;
  resolveLink: (url: string) => Promise<{
    videoId: string;
    name: string;
    artist: string;
    image: string;
    source: string;
  } | null>;
  addToQueue: (track: Track) => void;
}

export function PlaylistModal({
  open,
  onClose,
  onQueuePlaylist,
  onImportStatus,
  resolveLink,
  addToQueue,
}: Props) {
  const [playlists, setPlaylists] = useState<PlaylistInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [queuing, setQueuing] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");

  const [showImportSong, setShowImportSong] = useState(false);
  const [songUrl, setSongUrl] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolvedTrack, setResolvedTrack] = useState<{
    videoId: string;
    name: string;
    artist: string;
    image: string;
    source: string;
  } | null>(null);
  const [resolveError, setResolveError] = useState("");

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setShowImport(false);
    setShowImportSong(false);
    setImportUrl("");
    setImportError("");
    setSongUrl("");
    setResolvedTrack(null);
    setResolveError("");
    fetchPlaylists();
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  async function fetchPlaylists() {
    const token = localStorage.getItem("blu3_token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/playlists`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.playlists) setPlaylists(data.playlists);
    } catch (err) {
      console.error("Failed to fetch playlists:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleQueue(pId: string) {
    setQueuing(pId);
    try {
      await onQueuePlaylist(pId);
    } finally {
      setQueuing(null);
    }
  }

  const handleResolveSong = async () => {
    if (!songUrl.trim()) return;
    setResolving(true);
    setResolveError("");
    setResolvedTrack(null);
    try {
      const result = await resolveLink(songUrl.trim());
      if (!result) {
        setResolveError("Could not resolve this link. Try a different one.");
        return;
      }
      setResolvedTrack(result);
    } catch {
      setResolveError("Something went wrong. Try again.");
    } finally {
      setResolving(false);
    }
  };

  const handleAddSongToQueue = () => {
    if (!resolvedTrack) return;
    const track: Track = {
      id: `import-${resolvedTrack.videoId}`,
      source: resolvedTrack.source === "jiosaavn" ? "jiosaavn" : "youtube",
      videoId: resolvedTrack.videoId,
      name: resolvedTrack.name || "Imported track",
      duration_ms: 0,
      explicit: false,
      artists: [{ name: resolvedTrack.artist || "Unknown" }],
      album: { name: "" },
      image: resolvedTrack.image || "",
    };
    addToQueue(track);
    setSongUrl("");
    setResolvedTrack(null);
    setShowImportSong(false);
  };

  async function handleImport() {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError("");
    onImportStatus({ type: "importing" });
    const token = localStorage.getItem("blu3_token");
    try {
      const res = await fetch(`${API_URL}/api/playlists/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.playlist) {
        onImportStatus({ type: "done", trackCount: data.trackCount ?? 0 });
        setPlaylists((p) => [...p, data.playlist]);
        setImportUrl("");
        setShowImport(false);
      } else {
        const msg = data.error || "Failed to import";
        setImportError(msg);
        onImportStatus({ type: "error", error: msg });
      }
    } catch {
      const msg = "Network error";
      setImportError(msg);
      onImportStatus({ type: "error", error: msg });
    } finally {
      setImporting(false);
    }
  }

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-[90%] sm:w-[35vw] border border-white/40 max-w-[90vw] max-h-[80vh] flex flex-col rounded-4xl border backdrop-blur-2xl overflow-hidden shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]"
        style={{
          background: "var(--room-surface, rgba(0,0,0,0.4))",
          borderColor: "var(--room-border, rgba(255,255,255,0.08))",
        }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="text-lg font-medium text-white">Playlists</span>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <ScrollArea className="flex-1 px-3 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="text-white/40 animate-spin" />
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-10 text-white/40 text-[13px]">
              No playlists yet
            </div>
          ) : (
            <div className="space-y-3">
              {playlists.map((p) => (
                <div
                  key={p.id}
                  onClick={async () => {
                    await handleQueue(p.id);
                    onClose();
                  }}
                  className="flex cursor-pointer items-center gap-3 rounded-xl hover:bg-white/[0.04] transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white/10">
                    {p.coverImage ? (
                      <img
                        src={p.coverImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30">
                        <Icon
                          name="list-music"
                          size={16}
                          className="text-current"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white/90 truncate">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-white/40">
                      {p.trackCount ?? 0} tracks
                    </p>
                  </div>
                  {queuing === p.id && (
                    <Loader2
                      size={12}
                      className="shrink-0 text-violet-300 animate-spin"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {showImport && (
          <div className="px-4 py-0">
            <input
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleImport()}
              placeholder="https://open.spotify.com/playlist/..."
              className={`w-full px-1 py-3 text-sm rounded-xl outline-none bg-black/30 text-white placeholder:text-white/60 transition-colors border ${
                importError ? "border-[#C0392B]" : "border-white/[0.08]"
              }`}
            />
            {importError && (
              <p className="mt-2 text-[11px] text-red-400">{importError}</p>
            )}
            <button
              onClick={handleImport}
              disabled={importing || !importUrl.trim()}
              className="mt-2 w-full cursor-pointer  text-sm py-2.5 font-medium rounded-lg  bg-blue-200 text-black hover:bg-blue-100/70 transition-colors disabled:opacity-50"
            >
              {importing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Importing...
                </span>
              ) : (
                "Import"
              )}
            </button>
          </div>
        )}

        {showImportSong && (
          <div className="px-4 py-0">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={songUrl}
                onChange={(e) => setSongUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleResolveSong()}
                placeholder="Paste YouTube / Spotify / Apple Music link"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 outline-none focus:border-white/30 placeholder:text-white/40"
                disabled={resolving}
              />
              <button
                onClick={handleResolveSong}
                disabled={resolving || !songUrl.trim()}
                className="shrink-0 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer"
              >
                {resolving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Resolve"
                )}
              </button>
            </div>

            {resolveError && (
              <p className="text-sm text-red-400 mb-3 text-center">
                {resolveError}
              </p>
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
                    onClick={handleAddSongToQueue}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-100 px-4 py-2.5 text-base font-medium text-black transition-all hover:bg-blue-200 cursor-pointer"
                  >
                    Add to queue
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 px-4 pb-4 pt-2 ">
          <button
            onClick={() => {
              setShowImportSong((v) => !v);
              setResolveError("");
              setResolvedTrack(null);
              setSongUrl("");
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg   bg-blue-200 text-black hover:bg-blue-100/70 cursor-pointer duration-200 transition-colors"
          >
            <LinkIcon size={16} weight="regular" />
            Import Song
          </button>
          <button
            onClick={() => {
              setShowImport((v) => !v);
              setImportError("");
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg   bg-blue-200 text-black hover:bg-blue-100/70 cursor-pointer duration-200 transition-colors"
          >
            <Plus size={14} />
            Import Playlist
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
