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
import { ScrollArea } from "@/components/ui/ScrollArea";

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
  const { user, loading: authLoading, login, logout } = useAuth();
  const [playlists, setPlaylists] = useState<PlaylistInfo[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalTab, setModalTab] = useState<"create" | "import">("create");
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [creating, setCreating] = useState(false);

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
        setModalTab("create");
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
        setShowCreateModal(false);
        setImportUrl("");
        setModalTab("create");
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
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
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

  const SkeletonCard = () => (
    <div className="flex flex-col gap-2 w-28 sm:w-32 md:w-36 lg:w-40">
      <div className="aspect-square rounded-md bg-white/5 animate-pulse" />
      <div className="h-2.5 w-3/4 bg-white/5 rounded animate-pulse mt-1" />
      <div className="h-2 w-1/2 bg-white/5 rounded animate-pulse" />
    </div>
  );

  return (
    <div className="h-screen relative overflow-hidden">
      <div className="flex justify-center items-center z-10 h-full w-full overflow-hidden">
        <div className="flex flex-col justify-center items-center h-full w-full">
          {/* ── NAV BAR — identical to browse page ── */}
          <div className="flex absolute top-5 items-center border border-white/80 mt-2 rounded-2xl justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2 bg-white/5 backdrop-blur-2xl shadow-[0_4px_24px_-6px_rgba(0,0,0,0.4)] overflow-hidden before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:to-transparent">
            <Link
              href="/browse"
              className="text-lg font-black tracking-tight text-white hover:opacity-80 transition-opacity relative z-10"
            >
              blu3
            </Link>

            <div className="flex items-center gap-4 relative z-10">
              <div className="flex items-center gap-4 border-l border-white/10 pl-4 h-4">
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

            <div className="relative z-10">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="focus:outline-none"
                    aria-label="Open profile menu"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt=""
                        className="w-7 h-7 rounded-full border border-zinc-700 object-cover hover:border-zinc-500 transition-colors cursor-pointer"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                        {user.name?.[0] || "U"}
                      </div>
                    )}
                  </button>
                  {showProfileMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowProfileMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-44 rounded-xl bg-black/85 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl z-50">
                        <div className="px-3 py-2.5 border-b border-white/10">
                          <p className="text-[12px] font-bold text-white truncate">
                            {user.name}
                          </p>
                          <p className="text-[9px] text-zinc-500 truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            logout();
                          }}
                          className="w-full text-left px-3 py-2 text-[10px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors uppercase tracking-widest"
                        >
                          Log out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={login}
                  className="text-[11px] border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-400 hover:border-zinc-500 transition-colors tracking-widest uppercase"
                >
                  sign in
                </button>
              )}
            </div>
          </div>

          <ScrollArea className="flex flex-col items-center justify-center h-full w-full">
            <div className="flex flex-wrap items-center justify-center content-center gap-3 py-16 w-full min-h-full">
              {loadingPlaylists ? (
                Array.from({ length: 9 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              ) : playlists.length === 0 ? (
                  <div className="text-center">
                    <p className="text-zinc-600 text-sm mb-2 tracking-wide">
                      no playlists yet
                    </p>
                    <p className="text-[11px] text-zinc-700 tracking-widest">
                      create one or import from spotify · youtube · apple music
                    </p>
                  </div>
                ) : (
                  playlists.map((playlist) => {
                    const hasCover =
                      playlist.coverImage &&
                      playlist.coverImage.trim().length > 0;
                    return (
                      <div
                        key={playlist.id}
                        className="room-card flex flex-col gap-2 relative group/card w-28 sm:w-32 md:w-36 lg:w-40 cursor-pointer"
                        onClick={() => handleViewPlaylist(playlist)}
                      >
                        <div className="relative aspect-square overflow-hidden shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] before:absolute before:inset-0 before:pointer-events-none before:to-transparent">
                          {hasCover ? (
                            <Image
                              width={400}
                              height={400}
                              src={playlist.coverImage!}
                              alt={playlist.name}
                              className="room-card-img rounded-md w-full h-full object-cover"
                            />
                          ) : playlist.isLiked ? (
                            <div className="w-full h-full rounded-md bg-white/5 border border-white/[0.08] flex items-center justify-center">
                              <Heart
                                size={24}
                                className="text-white/20 fill-white/20"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-full rounded-md bg-white/5 border border-white/[0.08] flex items-center justify-center">
                              <Music2 size={20} className="text-white/15" />
                            </div>
                          )}

                          <div className="room-play-overlay hover:border-2 border-white rounded-md cursor-pointer absolute inset-0 flex items-center justify-center" />

                          {!playlist.isLiked && (
                            <button
                              onClick={(e) =>
                                handleDeletePlaylist(
                                  e,
                                  playlist.id,
                                  playlist.name,
                                )
                              }
                              className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500/80 hover:border-red-400/40 cursor-pointer z-10"
                              title="Delete playlist"
                            >
                              <Trash2 className="w-3 h-3 text-white/80" />
                            </button>
                          )}
                        </div>
                        <div className="px-0.5 mt-1 flex overflow-hidden relative w-full items-center">
                          <p className="text-xs md:text-[14px] text-white truncate leading-tight">
                            {playlist.name}
                            {playlist.trackCount !== undefined && (
                              <span className="text-zinc-500">
                                {" "}
                                • {playlist.trackCount}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Create card — identical pattern to browse's "+ Create Room" */}
                {!loadingPlaylists && (
                  <div
                    className="create-card flex flex-col gap-2 w-28 sm:w-32 md:w-36 lg:w-40 cursor-pointer"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <div className="aspect-square text-neutral-700 hover:text-neutral-400 border-2 border-dashed border-white/20 hover:border-white/30 backdrop-blur-2xl flex items-center justify-center rounded-lg transition-all shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]">
                      <Plus
                        className="create-plus w-30 h-30 transition-all"
                        strokeWidth={2.25}
                      />
                    </div>
                    <div className="px-0.5">
                      <p className="text-xs md:text-sm text-center uppercase text-white tracking-wide">
                        New Playlist
                      </p>
                    </div>
                  </div>
                )}
              </div>
          </ScrollArea>
        </div>
      </div>

      {/* ── UNIFIED CREATE / IMPORT MODAL ── */}
      {showCreateModal && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !importing && !creating) {
              setShowCreateModal(false);
              setNewPlaylistName("");
              setImportUrl("");
              setImportError("");
              setModalTab("create");
            }
          }}
        >
          <div className="modal-box w-full max-w-sm mx-4 rounded-[24px] p-6 bg-white/[0.05] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] relative overflow-hidden before:absolute before:inset-0 before:rounded-[24px] before:pointer-events-none before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent">
            {/* Tab switcher */}
            <div className="flex items-center gap-1 mb-5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] relative z-10">
              <button
                onClick={() => {
                  setModalTab("create");
                  setImportError("");
                }}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer ${
                  modalTab === "create"
                    ? "bg-white text-black"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                create
              </button>
              <button
                onClick={() => {
                  setModalTab("import");
                  setNewPlaylistName("");
                }}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer ${
                  modalTab === "import"
                    ? "bg-white text-black"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                import
              </button>
            </div>

            {/* CREATE tab */}
            {modalTab === "create" && (
              <>
                <p className="text-[11px] text-zinc-500 tracking-widest mb-4 relative z-10 uppercase">
                  give it a name
                </p>
                <input
                  autoFocus
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") {
                      setShowCreateModal(false);
                      setNewPlaylistName("");
                      setModalTab("create");
                    }
                  }}
                  placeholder="playlist name..."
                  maxLength={40}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 tracking-wide mb-4 focus:outline-none focus:border-white/25 transition-colors relative z-10"
                />
                <div className="flex gap-2 relative z-10">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewPlaylistName("");
                      setModalTab("create");
                    }}
                    className="flex-1 py-2.5 rounded-lg border border-white/10 text-zinc-500 text-[11px] tracking-widest uppercase font-bold hover:border-white/20 hover:text-zinc-300 transition-all cursor-pointer"
                  >
                    cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newPlaylistName.trim() || creating}
                    className="flex-1 py-2.5 rounded-lg bg-white text-black text-[11px] font-bold tracking-widest uppercase hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {creating ? "creating..." : "create"}
                  </button>
                </div>
              </>
            )}

            {/* IMPORT tab */}
            {modalTab === "import" && (
              <>
                <p className="text-[11px] text-zinc-500 tracking-widest mb-4 relative z-10 uppercase">
                  spotify · youtube · apple music
                </p>
                <input
                  autoFocus
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  disabled={importing}
                  onKeyDown={(e) => e.key === "Enter" && handleImport()}
                  placeholder="paste playlist link..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 tracking-wide mb-4 focus:outline-none focus:border-white/25 transition-colors disabled:opacity-40 relative z-10"
                />
                {importError && (
                  <p className="text-[10px] text-red-400 bg-red-950/20 border border-red-900/20 rounded-lg px-3 py-2 mb-4 leading-relaxed relative z-10">
                    {importError}
                  </p>
                )}
                {importing && (
                  <div className="flex items-center gap-2 mb-4 px-1 relative z-10">
                    <Loader2
                      size={13}
                      className="animate-spin text-zinc-500 shrink-0"
                    />
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest">
                      importing tracks...
                    </p>
                  </div>
                )}
                <div className="flex gap-2 relative z-10">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setImportUrl("");
                      setImportError("");
                      setModalTab("create");
                    }}
                    disabled={importing}
                    className="flex-1 py-2.5 rounded-lg border border-white/10 text-zinc-500 text-[11px] tracking-widest uppercase font-bold hover:border-white/20 hover:text-zinc-300 transition-all disabled:opacity-30 cursor-pointer"
                  >
                    cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!importUrl.trim() || importing}
                    className="flex-1 py-2.5 rounded-lg bg-white text-black text-[11px] font-bold tracking-widest uppercase hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {importing ? "importing..." : "import"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── PLAYLIST DETAIL MODAL ── */}
      {activePlaylist && (
        <div
          className="modal-backdrop fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseDetailsModal();
          }}
        >
          <div
            className="modal-box w-full max-w-2xl mx-auto rounded-[24px] flex flex-col bg-white/[0.05] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] overflow-hidden relative before:absolute before:inset-0 before:rounded-[24px] before:pointer-events-none before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent"
            style={{ height: "85vh" }}
          >
            {/* Header */}
            <div className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.06] shrink-0 relative z-10">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/[0.05] border border-white/[0.08] shrink-0">
                {activePlaylist.coverImage ? (
                  <img
                    src={activePlaylist.coverImage}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                ) : activePlaylist.isLiked ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Heart size={18} className="text-white/30 fill-white/30" />
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
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">
                  {activeTracks.length} song{activeTracks.length !== 1 && "s"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!activePlaylist.isLiked && (
                  <button
                    onClick={openAddSearch}
                    className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 transition-all cursor-pointer"
                    title="Add tracks"
                  >
                    <Plus size={12} />
                  </button>
                )}
                {activeTracks.length > 0 && (
                  <button
                    onClick={handleQueueAll}
                    className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 transition-all cursor-pointer"
                    title="Queue all"
                  >
                    <Play size={12} className="fill-current ml-0.5" />
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

            {/* Track list */}
            <ScrollArea className="flex-1 min-h-0 relative z-10">
              {loadingTracks ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin text-zinc-500" size={20} />
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
                      className={`group/track flex items-center gap-3 px-3 py-2 rounded-xl transition-colors
                        ${!activePlaylist.isLiked ? "cursor-grab active:cursor-grabbing" : ""}
                        ${draggedIdx === idx ? "opacity-20" : ""}
                        ${
                          dragOverIdx === idx && draggedIdx !== idx
                            ? "bg-white/[0.08] border border-white/10"
                            : "border border-transparent hover:bg-white/[0.04]"
                        }`}
                    >
                      {!activePlaylist.isLiked && (
                        <GripVertical
                          size={12}
                          className="text-zinc-600 shrink-0"
                        />
                      )}
                      <span className="text-[10px] text-zinc-600 w-4 text-right font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/[0.05] border border-white/[0.06]">
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
                        <p className="text-[13px] font-bold text-white truncate leading-snug">
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
                          className="w-6 h-6 rounded-lg border border-white/10 flex items-center justify-center text-zinc-600 opacity-0 group-hover/track:opacity-100 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Add track search panel */}
            {!activePlaylist.isLiked && showAddSearch && (
              <div className="shrink-0 border-t border-white/[0.06] relative z-10">
                <div className="flex flex-col" style={{ maxHeight: "280px" }}>
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                    <Search size={12} className="text-zinc-500 shrink-0" />
                    <input
                      autoFocus
                      value={modalSearchQuery}
                      onChange={(e) => handleModalSearchChange(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleModalSearch(modalSearchQuery)
                      }
                      placeholder="search songs to add..."
                      className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none"
                    />
                    {isSearchingModal ? (
                      <Loader2
                        size={12}
                        className="animate-spin text-zinc-500 shrink-0"
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setShowAddSearch(false);
                          setModalSearchResults([]);
                          setModalSearchQuery("");
                        }}
                        className="text-zinc-500 hover:text-white transition-colors cursor-pointer shrink-0"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <ScrollArea className="flex flex-col px-2 py-1.5">
                    {modalSearchResults.length === 0 && !isSearchingModal && (
                      <div className="flex items-center justify-center py-6">
                        <p className="text-[9px] text-zinc-700 uppercase tracking-widest">
                          type to search...
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
                          className="flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:bg-white/[0.04] transition-colors"
                        >
                          <img
                            src={
                              track.image || "https://via.placeholder.com/150"
                            }
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/[0.06]"
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
                              ${
                                alreadyAdded
                                  ? "border border-white/[0.08] text-zinc-600 cursor-default"
                                  : "bg-white text-black hover:bg-zinc-200 disabled:opacity-30"
                              }`}
                          >
                            {alreadyAdded
                              ? "added"
                              : addingTrackId === track.id
                                ? "..."
                                : "+ add"}
                          </button>
                        </div>
                      );
                    })}
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
