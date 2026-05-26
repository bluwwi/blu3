"use client";

import { useEffect, useState } from "react";
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
  FolderMusic,
  ChevronRight,
  Loader2,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface PlaylistInfo {
  id: string;
  name: string;
  isLiked: boolean;
  createdAt: string;
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

  const removeTrackFromPlaylist = async (trackId: string) => {
    // Optional stretch: implement track deletion in custom playlists
    // For now we can simply update local UI
    setActiveTracks((prev) => prev.filter((t) => t.id !== trackId));
  };

  return (
    <div
      className="h-screen bg-[#080808] text-white flex flex-col overflow-hidden relative"
      style={{ fontFamily: "'DM Mono', monospace" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');

        .playlist-card {
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      border-color 0.25s ease,
                      background 0.25s ease;
        }
        .playlist-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.02);
        }
        .liked-card {
          background: linear-gradient(135deg, rgba(88, 28, 135, 0.15) 0%, rgba(13, 148, 136, 0.05) 100%);
          border: 1px solid rgba(139, 92, 246, 0.2);
        }
        .liked-card:hover {
          border-color: rgba(139, 92, 246, 0.45);
          background: linear-gradient(135deg, rgba(88, 28, 135, 0.25) 0%, rgba(13, 148, 136, 0.1) 100%);
        }
        .btn-premium {
          transition: background 0.2s ease, transform 0.15s ease;
        }
        .btn-premium:hover {
          background: #e4e4e4;
        }
        .btn-premium:active {
          transform: scale(0.97);
        }

        /* Modals */
        .modal-backdrop {
          animation: fadeIn 0.18s ease;
        }
        .modal-box {
          animation: slideUp 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.3) !important;
        }
      `}</style>

      {/* ── Navigation floating bar ── */}
      <div className="absolute top-5 left-6 flex items-center gap-6 z-50 select-none">
        <Link
          href="/browse"
          className="text-lg font-extrabold tracking-tight text-white hover:opacity-80 transition-opacity"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          blu3
        </Link>
        <div className="flex items-center gap-4 border-l border-zinc-800 pl-6 h-4">
          <Link
            href="/browse"
            className="text-[10px] tracking-widest uppercase text-zinc-500 hover:text-white font-medium transition-colors"
          >
            Rooms
          </Link>
          <Link
            href="/playlists"
            className="text-[10px] tracking-widest uppercase text-white font-medium transition-colors"
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
                  className="w-7 h-7 rounded-full border border-zinc-700 object-cover hover:border-zinc-500 transition-colors cursor-pointer"
                />
              </button>
            )}

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-32 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                    router.push("/");
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors uppercase tracking-widest"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => router.push("/")}
            className="text-[11px] border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-400 hover:border-zinc-500 transition-colors tracking-widest uppercase"
          >
            sign in
          </button>
        )}
      </div>

      {/* ── Main Container ── */}
      <div className="flex-1 flex flex-col items-center justify-start px-8 pb-12 pt-24 overflow-y-auto">
        {!user && !authLoading ? (
          <div className="text-center my-auto">
            <p
              className="text-4xl font-extrabold tracking-tight mb-2"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              blu3
            </p>
            <p className="text-[11px] text-zinc-600 tracking-widest mb-10">
              listen together
            </p>
            <p className="text-zinc-500 text-sm mb-6 tracking-wide">
              sign in to access your custom playlists
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-5 py-2.5 bg-white text-black text-xs rounded-xl tracking-widest uppercase font-medium hover:bg-zinc-200 transition-colors"
            >
              go to sign in
            </button>
          </div>
        ) : (
          <div className="w-full max-w-5xl">
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-zinc-900 pb-5 mb-8">
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  playlists
                </h1>
                <p className="text-[10px] text-zinc-500 tracking-widest uppercase mt-1">
                  your personal sound collection
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-850 hover:border-zinc-700 bg-zinc-900/40 text-xs tracking-wider uppercase text-zinc-300 transition-colors cursor-pointer"
                >
                  <Link2 size={13} />
                  import playlist
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-black font-semibold text-xs tracking-wider uppercase btn-premium cursor-pointer"
                >
                  <Plus size={13} />
                  create playlist
                </button>
              </div>
            </div>

            {/* Playlists grid */}
            {loadingPlaylists ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-2xl bg-zinc-900/60 animate-pulse border border-zinc-900" />
                ))}
              </div>
            ) : playlists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10">
                <FolderMusic size={40} className="text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500 tracking-wide mb-1">No playlists yet</p>
                <p className="text-xs text-zinc-600">Create one or import from Spotify/YouTube to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {playlists.map((playlist) => {
                  if (playlist.isLiked) {
                    return (
                      <div
                        key={playlist.id}
                        onClick={() => handleViewPlaylist(playlist)}
                        className="playlist-card liked-card rounded-2xl p-5 aspect-square flex flex-col justify-between relative group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-rose-500 shadow-inner shadow-violet-500/20">
                          <Heart size={18} className="fill-current animate-pulse" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white tracking-wide truncate">{playlist.name}</p>
                          <p className="text-[9px] text-zinc-500 tracking-widest uppercase mt-0.5">default playlist</p>
                        </div>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight size={14} className="text-violet-400" />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={playlist.id}
                      onClick={() => handleViewPlaylist(playlist)}
                      className="playlist-card rounded-2xl p-5 border border-zinc-850 bg-zinc-900/30 aspect-square flex flex-col justify-between relative group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-zinc-800/40 border border-zinc-800 flex items-center justify-center text-zinc-400">
                        <Music2 size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white tracking-wide truncate">{playlist.name}</p>
                        <p className="text-[9px] text-zinc-500 tracking-widest uppercase mt-0.5">custom playlist</p>
                      </div>

                      {/* Hover delete button */}
                      <button
                        onClick={(e) => handleDeletePlaylist(e, playlist.id, playlist.name)}
                        className="absolute bottom-4 right-4 w-7 h-7 rounded-full bg-black/60 border border-zinc-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80 hover:border-red-400/40 cursor-pointer"
                        title="Delete playlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
              setNewPlaylistName("");
            }
          }}
        >
          <div
            className="modal-box w-full max-w-sm mx-4 rounded-2xl p-6 border border-white/10"
            style={{ background: "rgba(18,18,18,0.85)", backdropFilter: "blur(24px)" }}
          >
            <p className="text-sm font-bold tracking-tight mb-1 font-syne" style={{ fontFamily: "'Syne', sans-serif" }}>
              new playlist
            </p>
            <p className="text-[10px] text-zinc-500 tracking-widest uppercase mb-5">
              name your collection
            </p>

            <input
              autoFocus
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Chill Beats..."
              maxLength={40}
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 mb-4 transition-colors"
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPlaylistName("");
                }}
                className="flex-1 py-2 rounded-xl border border-zinc-800 text-zinc-500 text-[10px] tracking-widest uppercase hover:border-zinc-600 hover:text-zinc-300 transition-colors"
              >
                cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newPlaylistName.trim() || creating}
                className="flex-1 py-2 rounded-xl bg-white text-black text-[10px] font-semibold tracking-widest uppercase btn-premium disabled:opacity-30 disabled:cursor-not-allowed"
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
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !importing) {
              setShowImportModal(false);
              setImportUrl("");
              setImportError("");
            }
          }}
        >
          <div
            className="modal-box w-full max-w-md mx-4 rounded-2xl p-6 border border-white/10"
            style={{ background: "rgba(18,18,18,0.85)", backdropFilter: "blur(24px)" }}
          >
            <p className="text-sm font-bold tracking-tight mb-1 font-syne" style={{ fontFamily: "'Syne', sans-serif" }}>
              import playlist
            </p>
            <p className="text-[10px] text-zinc-500 tracking-widest uppercase mb-5">
              Paste Spotify or YouTube Music link
            </p>

            <input
              autoFocus
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              disabled={importing}
              onKeyDown={(e) => e.key === "Enter" && handleImport()}
              placeholder="https://open.spotify.com/playlist/... or YouTube link..."
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 mb-3 transition-colors disabled:opacity-50"
            />

            {importError && (
              <p className="text-[11px] text-red-400 mb-4 bg-red-950/20 border border-red-900/30 rounded-lg p-2.5 leading-normal">
                {importError}
              </p>
            )}

            {importing && (
              <div className="flex flex-col items-center justify-center py-4 mb-4 gap-2">
                <Loader2 size={24} className="animate-spin text-zinc-400" />
                <p className="text-[11px] text-zinc-400 animate-pulse tracking-wide text-center">
                  Importing tracks & resolving Spotify titles on YouTube...<br />
                  <span className="text-[9px] text-zinc-650">(This may take a moment)</span>
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
                className="flex-1 py-2 rounded-xl border border-zinc-800 text-zinc-500 text-[10px] tracking-widest uppercase hover:border-zinc-600 hover:text-zinc-300 transition-colors disabled:opacity-30"
              >
                cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importUrl.trim() || importing}
                className="flex-1 py-2 rounded-xl bg-white text-black text-[10px] font-semibold tracking-widest uppercase btn-premium disabled:opacity-30 disabled:cursor-not-allowed"
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
          className="modal-backdrop fixed inset-0 z-40 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActivePlaylist(null);
              setActiveTracks([]);
            }
          }}
        >
          <div
            className="modal-box w-full max-w-2xl mx-4 rounded-2xl flex flex-col h-[80vh] border border-white/10"
            style={{ background: "rgba(16,16,16,0.9)", backdropFilter: "blur(32px)" }}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start p-6 border-b border-zinc-900 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {activePlaylist.isLiked ? (
                    <Heart size={16} className="text-rose-500 fill-current shrink-0" />
                  ) : (
                    <FolderMusic size={16} className="text-zinc-400 shrink-0" />
                  )}
                  <h2
                    className="text-lg font-bold tracking-tight truncate font-syne"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    {activePlaylist.name}
                  </h2>
                </div>
                <p className="text-[10px] text-zinc-500 tracking-widest uppercase mt-0.5">
                  {activeTracks.length} song{activeTracks.length !== 1 && "s"} inside
                </p>
              </div>

              <div className="flex items-center gap-3">
                {activeTracks.length > 0 && (
                  <button
                    onClick={handleQueueAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-[10px] tracking-wider uppercase btn-premium cursor-pointer"
                  >
                    <Play size={10} className="fill-current" />
                    queue all
                  </button>
                )}
                <button
                  onClick={() => {
                    setActivePlaylist(null);
                    setActiveTracks([]);
                  }}
                  className="p-1 rounded-lg border border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Tracks List */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              {loadingTracks ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin text-zinc-500" size={24} />
                </div>
              ) : activeTracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                  <Music2 size={32} className="text-zinc-750 mb-2 animate-bounce" />
                  <p className="text-xs">No tracks in this playlist</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">Like songs in your rooms to populate this list.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {activeTracks.map((track, idx) => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-zinc-900 transition-all group/item"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[10px] text-zinc-650 w-4 text-right tabular-nums">{idx + 1}</span>
                        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-zinc-850">
                          {track.image ? (
                            <img src={track.image} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-700">
                              <Music2 size={14} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-white truncate leading-snug">{track.trackName}</p>
                          <p className="text-[10px] text-zinc-500 truncate mt-0.5">{track.artistName}</p>
                        </div>
                      </div>

                      {/* Remove track action (stretch placeholder) */}
                      {!activePlaylist.isLiked && (
                        <button
                          onClick={() => removeTrackFromPlaylist(track.id)}
                          className="w-6 h-6 rounded-full border border-zinc-850 flex items-center justify-center text-zinc-600 opacity-0 group-hover/item:opacity-100 transition-opacity hover:border-red-950 hover:bg-red-950/20 hover:text-red-400 cursor-pointer"
                          title="Remove from playlist"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
