"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import {
  Plus,
  Link2,
  Heart,
  Trash2,
  Play,
  X,
  Music2,
  FolderHeart,
  Loader2,
  GripVertical,
  Search,
} from "lucide-react";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface PlaylistInfo {
  id: string;
  name: string;
  isLiked: boolean;
  createdAt: string;
  coverImage?: string;
  trackCount?: number;
}
interface PlaylistTrack {
  id: string;
  videoId: string;
  trackName: string;
  artistName: string;
  image: string;
  durationMs: number;
}

export default function PlaylistsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [playlists, setPlaylists] = useState<PlaylistInfo[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [creating, setCreating] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");

  const [activePlaylist, setActivePlaylist] = useState<PlaylistInfo | null>(
    null,
  );
  const [activeTracks, setActiveTracks] = useState<PlaylistTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [lastRoomCode, setLastRoomCode] = useState<string | null>(null);

  const [showAddSearch, setShowAddSearch] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [modalSearchResults, setModalSearchResults] = useState<any[]>([]);
  const [isSearchingModal, setIsSearchingModal] = useState(false);
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null);

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const modalSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const fetchPlaylists = async () => {
    const token = localStorage.getItem("blu3_token");
    if (!token) {
      setLoadingPlaylists(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/playlists`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.playlists) setPlaylists(data.playlists);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoadingPlaylists(false);
      return;
    }
    fetchPlaylists();
    setLastRoomCode(localStorage.getItem("blu3_last_room"));
  }, [authLoading, user]);

  const handleCreate = async () => {
    if (!newPlaylistName.trim()) return;
    setCreating(true);
    const token = localStorage.getItem("blu3_token");
    try {
      const res = await fetch(`${API_URL}/api/playlists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newPlaylistName.trim() }),
      });
      const data = await res.json();
      if (data.playlist) {
        setPlaylists((p) => [...p, data.playlist]);
        setShowCreateModal(false);
        setNewPlaylistName("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError("");
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
        setPlaylists((p) => [...p, data.playlist]);
        setShowImportModal(false);
        setImportUrl("");
      } else
        setImportError(
          data.error || "Failed to import. Check the URL and try again.",
        );
    } catch {
      setImportError("Network error. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  const handleDeletePlaylist = async (
    e: React.MouseEvent,
    id: string,
    name: string,
  ) => {
    e.stopPropagation();
    if (!confirm(`Delete "${name}"?`)) return;
    const token = localStorage.getItem("blu3_token");
    try {
      const res = await fetch(`${API_URL}/api/playlists/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPlaylists((p) => p.filter((x) => x.id !== id));
        if (activePlaylist?.id === id) setActivePlaylist(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewPlaylist = async (playlist: PlaylistInfo) => {
    setActivePlaylist(playlist);
    setLoadingTracks(true);
    setShowAddSearch(false);
    const token = localStorage.getItem("blu3_token");
    try {
      const res = await fetch(`${API_URL}/api/playlists/${playlist.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.tracks) setActiveTracks(data.tracks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTracks(false);
    }
  };

  const handleQueueAll = () => {
    if (!activePlaylist) return;
    if (!lastRoomCode) {
      const code = prompt("Enter a Room Code:");
      if (!code?.trim()) return;
      localStorage.setItem("blu3_last_room", code.trim().toUpperCase());
      router.push(
        `/room/${code.trim().toUpperCase()}?queuePlaylistId=${activePlaylist.id}`,
      );
    } else {
      router.push(`/room/${lastRoomCode}?queuePlaylistId=${activePlaylist.id}`);
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (!activePlaylist) return;
    const token = localStorage.getItem("blu3_token");
    try {
      const res = await fetch(
        `${API_URL}/api/playlists/${activePlaylist.id}/tracks/${trackId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) setActiveTracks((p) => p.filter((t) => t.id !== trackId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragStart = (e: React.DragEvent, i: number) => {
    setDraggedIdx(i);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragOverIdx !== i) setDragOverIdx(i);
  };
  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };
  const handleDrop = async (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    setDragOverIdx(null);
    if (draggedIdx === null || draggedIdx === targetIdx || !activePlaylist)
      return;
    const updated = [...activeTracks];
    const [moved] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, moved);
    setActiveTracks(updated);
    setDraggedIdx(null);
    const token = localStorage.getItem("blu3_token");
    try {
      await fetch(
        `${API_URL}/api/playlists/${activePlaylist.id}/tracks/reorder`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ trackIds: updated.map((t) => t.id) }),
        },
      );
    } catch {
      handleViewPlaylist(activePlaylist);
    }
  };

  const handleModalSearchChange = (val: string) => {
    setModalSearchQuery(val);
    if (modalSearchTimeoutRef.current)
      clearTimeout(modalSearchTimeoutRef.current);
    modalSearchTimeoutRef.current = setTimeout(
      () => handleModalSearch(val || "trending"),
      350,
    );
  };

  const handleModalSearch = async (q: string) => {
    if (!q.trim()) {
      setModalSearchResults([]);
      return;
    }
    setIsSearchingModal(true);
    try {
      const res = await fetch(
        `${API_URL}/api/search?q=${encodeURIComponent(q.trim())}`,
      );
      const data = await res.json();
      if (data.tracks) setModalSearchResults(data.tracks);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingModal(false);
    }
  };

  const handleAddTrackToPlaylist = async (track: any) => {
    if (!activePlaylist) return;
    setAddingTrackId(track.id);
    const token = localStorage.getItem("blu3_token");
    try {
      const artistName =
        track.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist";
      const res = await fetch(
        `${API_URL}/api/playlists/${activePlaylist.id}/tracks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            videoId: track.videoId,
            trackName: track.name,
            artistName,
            image: track.image || "",
            durationMs: track.duration_ms || 0,
          }),
        },
      );
      const data = await res.json();
      if (res.ok && data.track)
        setActiveTracks((p) => [
          ...p,
          {
            id: data.track.id,
            videoId: data.track.videoId,
            trackName: data.track.trackName,
            artistName: data.track.artistName,
            image: data.track.image,
            durationMs: data.track.durationMs,
          },
        ]);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingTrackId(null);
    }
  };

  const handleCloseDetailsModal = () => {
    setActivePlaylist(null);
    setActiveTracks([]);
    setShowAddSearch(false);
    setModalSearchQuery("");
    setModalSearchResults([]);
    if (modalSearchTimeoutRef.current)
      clearTimeout(modalSearchTimeoutRef.current);
  };

  const openAddSearch = () => {
    setShowAddSearch(true);
    handleModalSearch("trending");
  };

  return (
    <div className="h-screen bg-[#060608] text-white flex flex-col overflow-hidden relative">
      <style>{`
        .sc::-webkit-scrollbar{width:3px}
        .sc::-webkit-scrollbar-track{background:transparent}
        .sc::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:99px}

        .modal-in { animation: min 0.2s cubic-bezier(0.34,1.1,0.64,1) forwards }
        @keyframes min { from{opacity:0;transform:translateY(10px) scale(0.98)} to{opacity:1;transform:none} }

        .bd-in { animation: bdin 0.18s ease forwards }
        @keyframes bdin { from{opacity:0} to{opacity:1} }

        .pc { transition: transform 0.2s ease }
        .pc:hover { transform: translateY(-3px) }
        .pc:hover .pn { color: #fff }
        .pc:hover .del-btn { opacity: 1 }
        .del-btn { opacity: 0; transition: opacity 0.15s }

        .tr { transition: background 0.12s }
        .tr:hover { background: rgba(255,255,255,0.035) }
        .tr:hover .tr-del { opacity: 1 }
        .tr-del { opacity: 0; transition: opacity 0.12s }

        .sr-panel { animation: srup 0.22s cubic-bezier(0.34,1.1,0.64,1) forwards }
        @keyframes srup { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
      `}</style>

      {/* Nav */}
      <div className="absolute top-5 left-6 flex items-center gap-5 z-50">
        <Link
          href="/browse"
          className="text-base font-black tracking-tight text-white hover:opacity-60 transition-opacity"
        >
          blu3
        </Link>
        <div className="flex items-center gap-3 border-l border-white/8 pl-5">
          <Link
            href="/browse"
            className="text-[9px] tracking-widest uppercase text-zinc-600 hover:text-zinc-300 font-bold transition-colors"
          >
            Rooms
          </Link>
          <Link
            href="/playlists"
            className="text-[9px] tracking-widest uppercase text-zinc-300 font-bold"
          >
            Playlists
          </Link>
        </div>
      </div>

      <div className="absolute top-5 right-6 z-50">
        {user ? (
          <div className="relative">
            {user.avatar && (
              <button onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <img
                  src={user.avatar}
                  alt=""
                  className="w-7 h-7 rounded-full border border-white/10 object-cover cursor-pointer hover:border-white/25 transition-colors"
                />
              </button>
            )}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-28 rounded-xl bg-[#0c0c10] border border-white/10 overflow-hidden shadow-2xl z-50">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                    router.push("/");
                  }}
                  className="w-full text-left px-3 py-2.5 text-[9px] font-bold text-red-400 hover:bg-red-500/10 transition-colors uppercase tracking-widest"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => router.push("/")}
            className="text-[9px] border border-white/10 rounded-lg px-3 py-1.5 text-zinc-400 hover:text-white hover:border-white/20 transition-all tracking-widest uppercase"
          >
            sign in
          </button>
        )}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center px-6 pb-8 pt-20 overflow-y-auto z-10 sc">
        {!user && !authLoading ? (
          <div className="text-center my-auto border border-white/8 bg-white/2 p-8 rounded-2xl max-w-xs">
            <p className="text-2xl font-black mb-6">blu3</p>
            <p className="text-sm text-zinc-500 mb-5 leading-relaxed">
              Sign in to manage your playlists.
            </p>
            <button
              onClick={() => router.push("/")}
              className="w-full py-2.5 bg-white text-black text-[10px] rounded-xl tracking-widest uppercase font-bold hover:bg-zinc-200 transition-colors"
            >
              sign in
            </button>
          </div>
        ) : (
          <div className="w-full max-w-4xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-7">
              <div>
                <h1 className="text-2xl font-black tracking-tight">
                  playlists
                </h1>
                <p className="text-[9px] text-zinc-600 tracking-widest uppercase mt-1 font-semibold">
                  your collection
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/10 hover:border-white/20 text-[9px] tracking-widest uppercase font-bold text-zinc-400 hover:text-white transition-all cursor-pointer bg-white/3"
                >
                  <Link2 size={10} /> import
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-black font-extrabold text-[9px] tracking-widest uppercase hover:bg-zinc-200 transition-colors cursor-pointer active:scale-95"
                >
                  <Plus size={10} /> create
                </button>
              </div>
            </div>

            {/* Grid */}
            {loadingPlaylists ? (
              <div className="flex flex-wrap gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2 w-32">
                    <div className="aspect-square rounded-xl bg-white/4 animate-pulse" />
                    <div className="h-2 w-3/4 bg-white/4 rounded animate-pulse" />
                    <div className="h-2 w-1/2 bg-white/3 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : playlists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border border-white/5 rounded-2xl">
                <FolderHeart size={32} className="text-zinc-700 mb-3" />
                <p className="text-sm font-bold text-zinc-500 mb-1">
                  No playlists yet
                </p>
                <p className="text-[11px] text-zinc-600 text-center max-w-xs leading-relaxed">
                  Create a playlist or import from Spotify / YouTube.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-5">
                {playlists.map((playlist) => {
                  const hasCover =
                    playlist.coverImage &&
                    playlist.coverImage.trim().length > 0;
                  return (
                    <div
                      key={playlist.id}
                      onClick={() => handleViewPlaylist(playlist)}
                      className="pc flex flex-col gap-2 relative group/card w-28 sm:w-32 md:w-36 lg:w-48 cursor-pointer select-none"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-[#111114] border border-white/6">
                        {hasCover ? (
                          <Image
                            width={200}
                            height={200}
                            src={playlist.coverImage!}
                            className="w-full h-full object-cover"
                            alt={playlist.name}
                            loading="lazy"
                          />
                        ) : playlist.isLiked ? (
                          <div className="w-full h-full flex items-center justify-center bg-[#111114]">
                            <Heart
                              size={24}
                              className="text-white/50 fill-white/50"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#111114]">
                            <Music2 size={20} className="text-white/15" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/35 transition-all flex items-center justify-center"></div>
                        {!playlist.isLiked && (
                          <button
                            onClick={(e) =>
                              handleDeletePlaylist(
                                e,
                                playlist.id,
                                playlist.name,
                              )
                            }
                            className="del-btn absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/80 border border-white/10 flex items-center justify-center hover:bg-red-500/80 transition-all cursor-pointer z-20"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                      <div>
                        <p className="pn text-[11px] text-zinc-300 truncate font-bold transition-colors">
                          {playlist.name}
                        </p>
                        <p className="text-[9px] text-zinc-600 truncate tracking-widest uppercase mt-0.5">
                          {playlist.trackCount || 0} track
                          {playlist.trackCount !== 1 && "s"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── CREATE MODAL ─── */}
      {showCreateModal && (
        <div
          className="bd-in fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
              setNewPlaylistName("");
            }
          }}
        >
          <div className="modal-in w-full max-w-xs mx-4 rounded-2xl p-6 bg-[#0c0c10] border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-black tracking-tight">new playlist</p>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPlaylistName("");
                }}
                className="w-6 h-6 rounded-lg border border-white/8 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 transition-all cursor-pointer"
              >
                <X size={11} />
              </button>
            </div>
            <input
              autoFocus
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="playlist name..."
              maxLength={40}
              className="w-full bg-white/4 border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 mb-5 focus:outline-none focus:border-white/25 transition-colors"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPlaylistName("");
                }}
                className="flex-1 py-2.5 rounded-xl border border-white/8 text-zinc-500 text-[9px] font-bold tracking-widest uppercase hover:border-white/15 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newPlaylistName.trim() || creating}
                className="flex-1 py-2.5 rounded-xl bg-white text-black text-[9px] font-black tracking-widest uppercase disabled:opacity-25 disabled:cursor-not-allowed hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                {creating ? "…" : "create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── IMPORT MODAL ─── */}
      {showImportModal && (
        <div
          className="bd-in fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={(e) => {
            if (e.target === e.currentTarget && !importing) {
              setShowImportModal(false);
              setImportUrl("");
              setImportError("");
            }
          }}
        >
          <div className="modal-in w-full max-w-sm mx-4 rounded-2xl p-6 bg-[#0c0c10] border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm font-black tracking-tight">
                import playlist
              </p>
              {!importing && (
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportUrl("");
                    setImportError("");
                  }}
                  className="w-6 h-6 rounded-lg border border-white/8 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 transition-all cursor-pointer"
                >
                  <X size={11} />
                </button>
              )}
            </div>
            <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-4">
              spotify · youtube music
            </p>
            <input
              autoFocus
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              disabled={importing}
              onKeyDown={(e) => e.key === "Enter" && handleImport()}
              placeholder="paste playlist link..."
              className="w-full bg-white/4 border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 mb-4 focus:outline-none focus:border-white/25 transition-colors disabled:opacity-40"
            />
            {importError && (
              <p className="text-[10px] text-red-400 bg-red-950/20 border border-red-900/20 rounded-lg px-3 py-2 mb-4 leading-relaxed">
                {importError}
              </p>
            )}
            {importing && (
              <div className="flex items-center gap-2 mb-4 px-1">
                <Loader2
                  size={13}
                  className="animate-spin text-zinc-500 shrink-0"
                />
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest">
                  importing tracks…
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportUrl("");
                  setImportError("");
                }}
                disabled={importing}
                className="flex-1 py-2.5 rounded-xl border border-white/8 text-zinc-500 text-[9px] font-bold tracking-widest uppercase hover:border-white/15 hover:text-zinc-300 transition-colors disabled:opacity-25 cursor-pointer"
              >
                cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importUrl.trim() || importing}
                className="flex-1 py-2.5 rounded-xl bg-white text-black text-[9px] font-black tracking-widest uppercase disabled:opacity-25 disabled:cursor-not-allowed hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                {importing ? "…" : "import"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activePlaylist && (
        <div
          className="bd-in fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseDetailsModal();
          }}
        >
          <div
            className="modal-in w-full max-w-2xl mx-auto rounded-2xl flex flex-col bg-[#0a0a0d] border border-white/10 shadow-2xl overflow-hidden"
            style={{ height: "85vh" }}
          >
            <div className="flex items-center gap-4 px-5 py-4 border-b border-white/6 shrink-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#111114] border border-white/8 shrink-0">
                {activePlaylist.coverImage ? (
                  <img
                    src={activePlaylist.coverImage}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                ) : activePlaylist.isLiked ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Heart size={18} className="text-white/50 fill-white/50" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music2 size={16} className="text-white/20" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-black text-white truncate tracking-tight">
                  {activePlaylist.name}
                </h2>
                <p className="text-[9px] text-zinc-600 uppercase tracking-widest mt-0.5">
                  {activeTracks.length} song{activeTracks.length !== 1 && "s"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {activeTracks.length > 0 && (
                  <button
                    onClick={handleQueueAll}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-black font-extrabold text-[9px] tracking-widest uppercase hover:bg-zinc-200 transition-colors cursor-pointer active:scale-95"
                  >
                    <Play size={9} className="fill-current" /> queue all
                  </button>
                )}
                <button
                  onClick={handleCloseDetailsModal}
                  className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 transition-all cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* Track list — takes all available space */}
            <div className="flex-1 overflow-y-auto sc min-h-0">
              {loadingTracks ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin text-zinc-600" size={20} />
                </div>
              ) : activeTracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-600 py-12">
                  <Music2 size={30} className="text-zinc-700 mb-3" />
                  <p className="text-xs font-bold text-zinc-500">
                    No tracks yet
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-1 max-w-xs text-center leading-relaxed">
                    {activePlaylist.isLiked
                      ? "Heart tracks in rooms to populate this."
                      : "Hit + to search and add tracks."}
                  </p>
                </div>
              ) : (
                <div className="px-3 py-2">
                  {activeTracks.map((track, idx) => (
                    <div
                      key={track.id}
                      draggable={!activePlaylist.isLiked ? "true" : "false"}
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, idx)}
                      className={`tr flex items-center gap-3 px-3 py-2 rounded-xl
                        ${!activePlaylist.isLiked ? "cursor-grab active:cursor-grabbing" : ""}
                        ${draggedIdx === idx ? "opacity-20" : ""}
                        ${dragOverIdx === idx && draggedIdx !== idx ? "!bg-white/5 border border-white/10" : "border border-transparent"}
                      `}
                    >
                      {!activePlaylist.isLiked && (
                        <GripVertical
                          size={12}
                          className="text-zinc-700 group-hover:text-zinc-500 shrink-0 transition-colors"
                        />
                      )}
                      <span className="text-[10px] text-zinc-700 w-4 text-right font-bold shrink-0">
                        {idx + 1}
                      </span>

                      {/* Track image — bigger now */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-[#111114] border border-white/6">
                        {track.image ? (
                          <img
                            src={track.image}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music2 size={14} className="text-white/15" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-white truncate leading-snug">
                          {track.trackName}
                        </p>
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                          {track.artistName}
                        </p>
                      </div>

                      {!activePlaylist.isLiked && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTrack(track.id);
                          }}
                          className="tr-del w-6 h-6 rounded-lg border border-white/8 flex items-center justify-center text-zinc-600 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add track section */}
            {!activePlaylist.isLiked && (
              <div className="shrink-0 border-t border-white/6">
                {!showAddSearch ? (
                  /* FAB row */
                  <div className="flex justify-center px-5 py-3">
                    <button
                      onClick={openAddSearch}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl text-[9px] font-black tracking-widest uppercase hover:bg-zinc-200 transition-colors cursor-pointer active:scale-95"
                    >
                      <Plus size={11} /> add tracks
                    </button>
                  </div>
                ) : (
                  /* Search panel */
                  <div
                    className="sr-panel flex flex-col"
                    style={{ maxHeight: "280px" }}
                  >
                    {/* Search input */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/6">
                      <Search size={12} className="text-zinc-600 shrink-0" />
                      <input
                        autoFocus
                        value={modalSearchQuery}
                        onChange={(e) =>
                          handleModalSearchChange(e.target.value)
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          handleModalSearch(modalSearchQuery)
                        }
                        placeholder="search songs to add..."
                        className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none"
                      />
                      {isSearchingModal ? (
                        <Loader2
                          size={12}
                          className="animate-spin text-zinc-600 shrink-0"
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setShowAddSearch(false);
                            setModalSearchResults([]);
                            setModalSearchQuery("");
                          }}
                          className="text-zinc-600 hover:text-white transition-colors cursor-pointer shrink-0"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    {/* Results */}
                    <div className="overflow-y-auto sc flex flex-col px-2 py-1.5">
                      {modalSearchResults.length === 0 && !isSearchingModal && (
                        <div className="flex items-center justify-center py-6">
                          <p className="text-[9px] text-zinc-700 uppercase tracking-widest">
                            type to search…
                          </p>
                        </div>
                      )}
                      {modalSearchResults.map((track) => {
                        const alreadyAdded = activeTracks.some(
                          (t) => t.videoId === track.videoId,
                        );
                        return (
                          <div
                            key={track.id}
                            className="tr flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent"
                          >
                            <img
                              src={
                                track.image || "https://via.placeholder.com/150"
                              }
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/6"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-bold text-white truncate leading-snug">
                                {track.name}
                              </p>
                              <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                                {track.artists
                                  ?.map((a: any) => a.name)
                                  .join(", ") || "Unknown Artist"}
                              </p>
                            </div>
                            <button
                              onClick={() => handleAddTrackToPlaylist(track)}
                              disabled={
                                addingTrackId === track.id || alreadyAdded
                              }
                              className={`shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-bold tracking-widest uppercase transition-all cursor-pointer
                                ${alreadyAdded ? "border border-white/6 text-zinc-700 cursor-default" : "bg-white text-black hover:bg-zinc-200 disabled:opacity-30"}`}
                            >
                              {alreadyAdded
                                ? "added"
                                : addingTrackId === track.id
                                  ? "…"
                                  : "+ add"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
