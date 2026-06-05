"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, BugPlay, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Icon } from "@/hooks/useIcon";
import { ImportStatus } from "./ImportToast";
import { PlaylistIcon } from "@phosphor-icons/react";

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
}

export function PlaylistModal({
  open,
  onClose,
  onQueuePlaylist,
  onImportStatus,
}: Props) {
  const [playlists, setPlaylists] = useState<PlaylistInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [queuing, setQueuing] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setShowImport(false);
    setImportUrl("");
    setImportError("");
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
        className="w-[90%] md:w-[35vw] max-w-[90vw] max-h-[80vh] flex flex-col rounded-4xl border backdrop-blur-2xl overflow-hidden shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]"
        style={{
          background: "var(--room-surface, rgba(0,0,0,0.4))",
          borderColor: "var(--room-border, rgba(255,255,255,0.08))",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="text-lg font-medium text-white">Playlists</span>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Playlist list */}
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
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white/10">
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

        {/* Import URL input (inline) */}
        {showImport && (
          <div className="px-3 py-3 border-t border-white/[0.06]">
            <p className="text-[12px] text-white/50 mb-2">
              Paste a playlist link from Spotify, YouTube, JioSaavn, or Apple
              Music
            </p>
            <input
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleImport()}
              placeholder="https://open.spotify.com/playlist/..."
              className="w-full px-4 py-3 text-[13px] rounded-xl border bg-white/5 text-white placeholder:text-white/20 outline-none transition-colors"
              style={{
                borderColor: importError ? "#C0392B" : "rgba(255,255,255,0.08)",
              }}
            />
            {importError && (
              <p className="mt-2 text-[11px] text-red-400">{importError}</p>
            )}
            <button
              onClick={handleImport}
              disabled={importing || !importUrl.trim()}
              className="mt-2 w-full py-3 text-[13px] font-medium rounded-xl bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors disabled:opacity-50"
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

        {/* Bottom buttons */}
        <div className="flex gap-2 px-4 pb-4 pt-2 ">
          <button
            onClick={() => {
              setShowImport((v) => !v);
              setImportError("");
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg  bg-white text-black hover:bg-white/70 cursor-pointer duration-200 transition-colors"
          >
            <Plus size={14} />
            Import Playlist
          </button>
          <button
            onClick={() => {
              window.location.href = "/playlists";
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg  bg-white text-black hover:bg-white/70 cursor-pointer duration-200 transition-colors"
          >
            <PlaylistIcon size={16} weight="regular" />
            Manage
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
