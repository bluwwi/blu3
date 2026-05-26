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
  ChevronRight,
  Loader2,
  GripVertical,
} from "lucide-react";

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

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [creating, setCreating] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");

  const [activePlaylist, setActivePlaylist] = useState<PlaylistInfo | null>(null);
  const [activeTracks, setActiveTracks] = useState<PlaylistTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [lastRoomCode, setLastRoomCode] = useState<string | null>(null);

  // Search and edit states inside details modal
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [modalSearchResults, setModalSearchResults] = useState<any[]>([]);
  const [isSearchingModal, setIsSearchingModal] = useState(false);
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null);

  // Fetch all playlists
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
      if (data.playlists) {
        setPlaylists(data.playlists);
      }
    } catch (err) {
      console.error("Failed to load playlists:", err);
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

  // Load default trending tracks automatically on opening custom playlist editor
  useEffect(() => {
    if (activePlaylist && !activePlaylist.isLiked) {
      handleModalSearch("trending");
    }
  }, [activePlaylist]);

  // Create standard custom playlist
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
        setPlaylists((prev) => [...prev, data.playlist]);
        setShowCreateModal(false);
        setNewPlaylistName("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  // Import Spotify / YouTube Music playlist
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
        setPlaylists((prev) => [...prev, data.playlist]);
        setShowImportModal(false);
        setImportUrl("");
      } else {
        setImportError(data.error || "Failed to import playlist. Make sure the URL is valid and public.");
      }
    } catch (err) {
      console.error(err);
      setImportError("Network error occurred. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  // Delete custom playlist
  const handleDeletePlaylist = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`Delete playlist "${name}"? This cannot be undone.`)) return;
    const token = localStorage.getItem("blu3_token");
    try {
      const res = await fetch(`${API_URL}/api/playlists/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPlaylists((prev) => prev.filter((p) => p.id !== id));
        if (activePlaylist?.id === id) setActivePlaylist(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load tracks in a playlist
  const handleViewPlaylist = async (playlist: PlaylistInfo) => {
    setActivePlaylist(playlist);
    setLoadingTracks(true);
    const token = localStorage.getItem("blu3_token");
    try {
      const res = await fetch(`${API_URL}/api/playlists/${playlist.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.tracks) {
        setActiveTracks(data.tracks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTracks(false);
    }
  };

  // Play / Queue All - Redirects to last active room or requests code
  const handleQueueAll = () => {
    if (!activePlaylist) return;
    if (!lastRoomCode) {
      const code = prompt("You need to be in a room to queue songs! Enter a Room Code:");
      if (!code || !code.trim()) return;
      localStorage.setItem("blu3_last_room", code.trim().toUpperCase());
      router.push(`/room/${code.trim().toUpperCase()}?queuePlaylistId=${activePlaylist.id}`);
    } else {
      router.push(`/room/${lastRoomCode}?queuePlaylistId=${activePlaylist.id}`);
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (!activePlaylist) return;
    const token = localStorage.getItem("blu3_token");
    try {
      const res = await fetch(`${API_URL}/api/playlists/${activePlaylist.id}/tracks/${trackId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setActiveTracks((prev) => prev.filter((t) => t.id !== trackId));
      }
    } catch (err) {
      console.error("Failed to delete track:", err);
    }
  };

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDrop = async (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    setDragOverIdx(null);
    if (draggedIdx === null || draggedIdx === targetIdx || !activePlaylist) return;

    const updated = [...activeTracks];
    const [moved] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, moved);

    // Optimistic UI update
    setActiveTracks(updated);
    setDraggedIdx(null);

    const token = localStorage.getItem("blu3_token");
    try {
      const res = await fetch(`${API_URL}/api/playlists/${activePlaylist.id}/tracks/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trackIds: updated.map((t) => t.id) }),
      });
      if (!res.ok) {
        throw new Error("Reorder failed on server");
      }
    } catch (err) {
      console.error("Failed to reorder tracks:", err);
      handleViewPlaylist(activePlaylist);
    }
  };

  const modalSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleModalSearchChange = (val: string) => {
    setModalSearchQuery(val);

    if (modalSearchTimeoutRef.current) {
      clearTimeout(modalSearchTimeoutRef.current);
    }

    if (!val.trim()) {
      // Fall back to trending songs instead of empty results
      modalSearchTimeoutRef.current = setTimeout(() => {
        handleModalSearch("trending");
      }, 400);
      return;
    }

    modalSearchTimeoutRef.current = setTimeout(() => {
      handleModalSearch(val);
    }, 400);
  };

  const handleModalSearch = async (q: string) => {
    if (!q.trim()) {
      setModalSearchResults([]);
      return;
    }
    setIsSearchingModal(true);
    try {
      const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (data.tracks) {
        setModalSearchResults(data.tracks);
      }
    } catch (err) {
      console.error("Modal search failed:", err);
    } finally {
      setIsSearchingModal(false);
    }
  };

  const handleAddTrackToPlaylist = async (track: any) => {
    if (!activePlaylist) return;
    setAddingTrackId(track.id);
    const token = localStorage.getItem("blu3_token");
    try {
      const artistName = track.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist";
      const res = await fetch(`${API_URL}/api/playlists/${activePlaylist.id}/tracks`, {
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
      });
      const data = await res.json();
      if (res.ok && data.track) {
        setActiveTracks((prev) => [...prev, {
          id: data.track.id,
          videoId: data.track.videoId,
          trackName: data.track.trackName,
          artistName: data.track.artistName,
          image: data.track.image,
          durationMs: data.track.durationMs,
        }]);
      }
    } catch (err) {
      console.error("Failed to add track to playlist:", err);
    } finally {
      setAddingTrackId(null);
    }
  };

  const handleCloseDetailsModal = () => {
    setActivePlaylist(null);
    setActiveTracks([]);
    setModalSearchQuery("");
    setModalSearchResults([]);
    if (modalSearchTimeoutRef.current) {
      clearTimeout(modalSearchTimeoutRef.current);
    }
  };

  return (
    <div className="h-screen bg-[#050508] text-white flex flex-col overflow-hidden relative">
      {/* Premium ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-violet-600/10 via-purple-700/5 to-transparent rounded-full filter blur-[120px] pointer-events-none select-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-gradient-to-br from-teal-500/5 via-violet-800/10 to-transparent rounded-full filter blur-[100px] pointer-events-none select-none" />

      <style>{`
        .playlist-card {
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
          transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .playlist-card:hover {
          transform: translateY(-6px) scale(1.02);
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 12px 40px 0 rgba(139, 92, 246, 0.15);
        }
        .liked-card-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 120%, rgba(139, 92, 246, 0.15) 0%, transparent 80%);
          pointer-events: none;
        }
        .glass-panel {
          background: rgba(15, 15, 25, 0.4);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .modal-backdrop {
          animation: fadeIn 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .modal-box {
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 24px 70px 0 rgba(0, 0, 0, 0.7);
        }
        @keyframes fadeIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to   { opacity: 1; backdrop-filter: blur(12px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .room-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .room-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .room-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 99px;
        }
        .room-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        input:focus {
          outline: none;
          border-color: rgba(139, 92, 246, 0.5) !important;
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.15);
        }
      `}</style>

      {/* ── Navigation floating bar ── */}
      <div className="absolute top-5 left-6 flex items-center gap-6 z-50 select-none">
        <Link
          href="/browse"
          className="text-lg font-black tracking-tight text-white hover:opacity-80 transition-opacity"
        >
          blu3
        </Link>
        <div className="flex items-center gap-4 border-l border-white/10 pl-6 h-4">
          <Link
            href="/browse"
            className="text-[10px] tracking-widest uppercase text-zinc-400 hover:text-white font-bold transition-colors"
          >
            Rooms
          </Link>
          <Link
            href="/playlists"
            className="text-[10px] tracking-widest uppercase text-white font-bold transition-colors"
          >
            Playlists
          </Link>
        </div>
      </div>

      <div className="absolute top-5 right-6 flex items-center gap-4 z-50">
        {user ? (
          <div className="relative">
            {user.avatar && (
              <button onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <img
                  src={user.avatar}
                  alt=""
                  className="w-7 h-7 rounded-full border border-white/10 object-cover hover:border-white/30 transition-colors cursor-pointer"
                />
              </button>
            )}

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-32 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl z-50">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                    router.push("/");
                  }}
                  className="w-full text-left px-4 py-2.5 text-[9px] font-bold text-red-400 hover:bg-red-500/10 transition-colors uppercase tracking-widest"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => router.push("/")}
            className="text-[11px] border border-white/10 rounded-xl px-4 py-2 text-zinc-300 hover:border-white/30 hover:text-white transition-all tracking-widest uppercase bg-white/5 backdrop-blur-sm"
          >
            sign in
          </button>
        )}
      </div>

      {/* ── Main Container ── */}
      <div className="flex-1 flex flex-col items-center justify-start px-8 pb-12 pt-24 overflow-y-auto z-10">
        {!user && !authLoading ? (
          <div className="text-center my-auto glass-panel p-10 rounded-[32px] max-w-sm border border-white/10 relative overflow-hidden">
            <div className="liked-card-glow" />
            <p className="text-4xl font-black tracking-tight mb-2">
              blu3
            </p>
            <p className="text-[10px] text-zinc-500 tracking-widest uppercase mb-8">
              listen together
            </p>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              Sign in to unlock, curate, and listen to your custom playlists.
            </p>
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 bg-white text-black text-xs rounded-2xl tracking-widest uppercase font-bold hover:bg-zinc-200 transition-all cursor-pointer shadow-lg hover:shadow-white/10 active:scale-[0.98]"
            >
              go to sign in
            </button>
          </div>
        ) : (
          <div className="w-full max-w-5xl">
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-6 mb-10">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white">
                  playlists
                </h1>
                <p className="text-[9px] text-zinc-500 tracking-widest uppercase mt-1.5 font-semibold">
                  your personal sound collection
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 text-[10px] tracking-widest uppercase font-bold text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  <Link2 size={12} />
                  import
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-black font-extrabold text-[10px] tracking-widest uppercase hover:bg-zinc-250 transition-all cursor-pointer shadow-lg hover:shadow-white/10 active:scale-95"
                >
                  <Plus size={12} />
                  create
                </button>
              </div>
            </div>

            {/* Playlists flex grid (Centered) */}
            {loadingPlaylists ? (
              <div className="flex flex-wrap items-center justify-center gap-6 w-full">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="w-40 sm:w-44 md:w-48 lg:w-52 aspect-[3/4] rounded-[24px] bg-white/5 animate-pulse border border-white/5" />
                ))}
              </div>
            ) : playlists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 glass-panel border border-white/5 rounded-[28px]">
                <FolderHeart size={44} className="text-zinc-600 mb-4 animate-pulse" />
                <p className="text-sm font-bold tracking-wide text-zinc-300 mb-1">No playlists yet</p>
                <p className="text-xs text-zinc-500 max-w-xs text-center leading-relaxed px-6">
                  Create a custom playlist or import one from Spotify/YouTube to get started.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 w-full">
                {playlists.map((playlist) => {
                  const hasCover = playlist.coverImage && playlist.coverImage.trim().length > 0;
                  
                  return (
                    <div
                      key={playlist.id}
                      onClick={() => handleViewPlaylist(playlist)}
                      className={`playlist-card w-40 sm:w-44 md:w-48 lg:w-52 aspect-[3/4] rounded-[24px] p-4 flex flex-col justify-between relative group overflow-hidden cursor-pointer ${
                        playlist.isLiked 
                          ? "bg-gradient-to-b from-violet-950/20 to-purple-950/10 border border-violet-900/30 hover:border-violet-500/50" 
                          : "bg-white/5 border border-white/5"
                      }`}
                    >
                      {playlist.isLiked && <div className="liked-card-glow" />}

                      {/* Aspect square first song cover or fallback */}
                      <div className="relative w-full aspect-square rounded-[18px] overflow-hidden bg-zinc-900 border border-white/5 transition-transform duration-300 group-hover:scale-[1.02] shadow-inner shrink-0">
                        {hasCover ? (
                          <img 
                            src={playlist.coverImage} 
                            className="w-full h-full object-cover" 
                            alt={playlist.name} 
                            loading="lazy"
                          />
                        ) : playlist.isLiked ? (
                          <div className="w-full h-full bg-gradient-to-br from-violet-650 via-purple-750 to-pink-650 flex items-center justify-center relative">
                            <Heart size={32} className="text-white fill-white drop-shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse" />
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                            <Music2 size={32} className="text-white/20" />
                          </div>
                        )}

                        {/* Animated overlay play icon */}
                        <div className="absolute inset-0 bg-black/45 backdrop-blur-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-xl">
                            <Play size={16} className="fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Bottom Info details */}
                      <div className="mt-3 flex-1 flex flex-col justify-between z-10">
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-white tracking-wide truncate mt-1 group-hover:text-purple-400 transition-colors">
                            {playlist.name}
                          </p>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5 font-bold">
                            {playlist.trackCount || 0} track{playlist.trackCount !== 1 && "s"}
                          </p>
                        </div>
                      </div>

                      {/* Custom playlist action: delete button on hover */}
                      {!playlist.isLiked && (
                        <button
                          onClick={(e) => handleDeletePlaylist(e, playlist.id, playlist.name)}
                          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/80 hover:text-white hover:border-red-400/40 transition-all duration-200 cursor-pointer z-20"
                          title="Delete playlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Create Playlist Modal ── */}
      {showCreateModal && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
              setNewPlaylistName("");
            }
          }}
        >
          <div className="modal-box w-full max-w-sm mx-4 rounded-[28px] p-6 glass-panel border border-white/10 relative overflow-hidden">
            <div className="liked-card-glow" />
            <p className="text-base font-black tracking-tight mb-1 text-white">
              new playlist
            </p>
            <p className="text-[9px] text-zinc-500 tracking-widest uppercase mb-5 font-bold">
              name your collection
            </p>

            <input
              autoFocus
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Chill Beats..."
              maxLength={40}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-zinc-500 mb-5 transition-colors focus:bg-white/10"
            />

            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPlaylistName("");
                }}
                className="flex-1 py-3.5 rounded-2xl border border-white/10 text-zinc-400 text-[10px] font-bold tracking-widest uppercase hover:border-white/20 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newPlaylistName.trim() || creating}
                className="flex-1 py-3.5 rounded-2xl bg-white text-black text-[10px] font-black tracking-widest uppercase disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-200 transition-colors cursor-pointer active:scale-95 shadow-lg"
              >
                {creating ? "creating…" : "create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Playlist Modal ── */}
      {showImportModal && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget && !importing) {
              setShowImportModal(false);
              setImportUrl("");
              setImportError("");
            }
          }}
        >
          <div className="modal-box w-full max-w-md mx-4 rounded-[28px] p-6 glass-panel border border-white/10 relative overflow-hidden">
            <div className="liked-card-glow" />
            <p className="text-base font-black tracking-tight mb-1 text-white">
              import playlist
            </p>
            <p className="text-[9px] text-zinc-500 tracking-widest uppercase mb-5 font-bold">
              Paste Spotify or YouTube Music link
            </p>

            <input
              autoFocus
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              disabled={importing}
              onKeyDown={(e) => e.key === "Enter" && handleImport()}
              placeholder="https://open.spotify.com/playlist/... or YouTube link..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-zinc-500 mb-4 transition-colors focus:bg-white/10 disabled:opacity-50"
            />

            {importError && (
              <p className="text-[10px] text-red-400 mb-4 bg-red-950/20 border border-red-900/30 rounded-2xl p-3 leading-relaxed">
                {importError}
              </p>
            )}

            {importing && (
              <div className="flex flex-col items-center justify-center py-4 mb-4 gap-2.5">
                <Loader2 size={24} className="animate-spin text-purple-400" />
                <p className="text-[10px] text-zinc-400 animate-pulse tracking-widest font-bold uppercase text-center leading-relaxed">
                  Importing tracks & resolving Spotify titles...<br />
                  <span className="text-[8px] text-zinc-600">(This might take a moment)</span>
                </p>
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportUrl("");
                  setImportError("");
                }}
                disabled={importing}
                className="flex-1 py-3.5 rounded-2xl border border-white/10 text-zinc-400 text-[10px] font-bold tracking-widest uppercase hover:border-white/20 hover:text-zinc-200 transition-colors disabled:opacity-30 cursor-pointer"
              >
                cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importUrl.trim() || importing}
                className="flex-1 py-3.5 rounded-2xl bg-white text-black text-[10px] font-black tracking-widest uppercase disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-200 transition-colors cursor-pointer active:scale-95 shadow-lg"
              >
                {importing ? "importing…" : "import"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Playlist Tracks Details Modal ── */}
      {activePlaylist && (
        <div
          className="modal-backdrop fixed inset-0 z-40 flex items-center justify-center bg-black/90 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseDetailsModal();
            }
          }}
        >
          <div className="modal-box w-full max-w-2xl mx-4 rounded-[28px] flex flex-col h-[80vh] glass-panel border border-white/10 overflow-hidden shadow-2xl relative">
            <div className="liked-card-glow" />
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/5 shrink-0 z-10 bg-black/10 backdrop-blur-md">
              <div className="flex items-center gap-4 min-w-0">
                {/* Visual artwork thumbnail */}
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0 shadow-lg relative">
                  {activePlaylist.coverImage ? (
                    <img src={activePlaylist.coverImage} className="w-full h-full object-cover" alt="" />
                  ) : activePlaylist.isLiked ? (
                    <div className="w-full h-full bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center">
                      <Heart size={20} className="text-white fill-white animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                      <Music2 size={20} className="text-white/30" />
                    </div>
                  )}
                </div>
                
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-white truncate tracking-wide leading-tight">
                    {activePlaylist.name}
                  </h2>
                  <p className="text-[9px] text-zinc-500 tracking-widest uppercase mt-1 font-bold">
                    {activeTracks.length} song{activeTracks.length !== 1 && "s"} inside
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {activeTracks.length > 0 && (
                  <button
                    onClick={handleQueueAll}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black font-extrabold text-[10px] tracking-widest uppercase hover:bg-zinc-200 transition-all cursor-pointer shadow-lg active:scale-95"
                  >
                    <Play size={10} className="fill-current" />
                    queue all
                  </button>
                )}
                <button
                  onClick={handleCloseDetailsModal}
                  className="p-2 rounded-full border border-white/10 text-zinc-400 hover:border-white/20 hover:text-white transition-all bg-white/5 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Modal Tracks List */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0 room-scroll z-10">
              {loadingTracks ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin text-purple-400" size={26} />
                </div>
              ) : activeTracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-10">
                  <Music2 size={36} className="text-zinc-700 mb-3 animate-bounce" />
                  <p className="text-xs font-bold text-zinc-400">No tracks in this playlist</p>
                  <p className="text-[10px] text-zinc-500 mt-1 max-w-xs text-center leading-relaxed">
                    {activePlaylist.isLiked 
                      ? "Heart tracks on search or in rooms to populate this list."
                      : "Use the search bar below to add tracks to your playlist."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {activeTracks.map((track, idx) => (
                    <div
                      key={track.id}
                      draggable={!activePlaylist.isLiked ? "true" : "false"}
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, idx)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border border-transparent transition-all group/item ${
                        !activePlaylist.isLiked 
                          ? "hover:bg-white/5 hover:border-white/5 cursor-grab active:cursor-grabbing" 
                          : "hover:bg-white/5 hover:border-white/5"
                      } ${draggedIdx === idx ? "opacity-30 bg-zinc-900/50 border-zinc-800 border-dashed" : ""} ${
                        dragOverIdx === idx && draggedIdx !== idx
                          ? "border-t-2 border-purple-500 bg-purple-950/15 scale-[1.01] shadow-lg shadow-purple-500/10"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Drag handle icon only for custom playlists */}
                        {!activePlaylist.isLiked && (
                          <GripVertical size={13} className="text-zinc-650 group-hover/item:text-zinc-400 cursor-grab flex-shrink-0" />
                        )}
                        <span className="text-[10px] text-zinc-600 w-4 text-right font-bold tabular-nums">{idx + 1}</span>
                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-zinc-900 border border-white/5 shadow-sm">
                          {track.image ? (
                            <img src={track.image} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-700">
                              <Music2 size={16} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-white truncate leading-snug">{track.trackName}</p>
                          <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-medium">{track.artistName}</p>
                        </div>
                      </div>

                      {/* Delete actions for custom playlists */}
                      {!activePlaylist.isLiked && (
                        <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTrack(track.id);
                            }}
                            className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 cursor-pointer transition-all"
                            title="Remove from playlist"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Search and Add Tracks Section (Only for Custom Playlists) */}
            {!activePlaylist.isLiked && (
              <div className="shrink-0 border-t border-white/5 p-6 bg-black/10 backdrop-blur-md z-10">
                <p className="text-[9px] font-bold tracking-widest mb-3 uppercase text-zinc-500">
                  Search & Add songs
                </p>
                <div className="flex gap-2.5 mb-3">
                  <input
                    value={modalSearchQuery}
                    onChange={(e) => handleModalSearchChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleModalSearch(modalSearchQuery)}
                    placeholder="Search songs on YouTube to add..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 transition-colors focus:bg-white/10"
                  />
                  <button
                    onClick={() => handleModalSearch(modalSearchQuery)}
                    disabled={isSearchingModal || !modalSearchQuery.trim()}
                    className="px-5 py-2.5 bg-white text-black text-xs font-bold rounded-2xl uppercase tracking-widest hover:bg-zinc-250 transition-colors disabled:opacity-30 cursor-pointer active:scale-95 shadow-md shrink-0"
                  >
                    {isSearchingModal ? "..." : "Search"}
                  </button>
                </div>

                {modalSearchResults.length > 0 && (
                  <div className="room-scroll max-h-40 overflow-y-auto flex flex-col gap-1.5 p-2 border border-white/5 rounded-2xl bg-black/45 shadow-inner">
                    {modalSearchResults.map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 border border-transparent transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={track.image || "https://via.placeholder.com/150"}
                            alt=""
                            className="w-9 h-9 rounded-xl object-cover flex-shrink-0 border border-white/5 shadow"
                          />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-white truncate leading-snug">{track.name}</p>
                            <p className="text-[9px] text-zinc-500 truncate mt-0.5 font-medium">
                              {track.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist"}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddTrackToPlaylist(track)}
                          disabled={addingTrackId === track.id}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white hover:text-black border border-white/10 hover:border-transparent text-[9px] font-bold tracking-widest uppercase transition-all cursor-pointer shrink-0"
                        >
                          {addingTrackId === track.id ? "Adding..." : "+ Add"}
                        </button>
                      </div>
                    ))}
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
