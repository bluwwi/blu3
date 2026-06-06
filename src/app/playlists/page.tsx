"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Profile } from "@/components/Profile";
import { cachedFetch } from "@/lib/fetchCache";
import { SkeletonCard } from "./SkeletonCard";
import { PlaylistCard } from "./PlaylistCard";
import CreateImportPlaylistModal from "./CreateImportPlaylistModal";
import PlaylistDetailModal from "./PlaylistDetailModal";

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
  const { user, loading: authLoading } = useAuth();
  const [playlists, setPlaylists] = useState<PlaylistInfo[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");

  const [activePlaylist, setActivePlaylist] = useState<PlaylistInfo | null>(
    null,
  );
  const [activeTracks, setActiveTracks] = useState<PlaylistTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);

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
      const data = await cachedFetch(`${API_URL}/api/playlists`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  const handleCreate = async (name: string) => {
    if (!name.trim()) return;
    setCreating(true);
    const token = localStorage.getItem("blu3_token");
    try {
      const res = await fetch(`${API_URL}/api/playlists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (data.playlist) {
        setPlaylists((p) => [...p, data.playlist]);
        setShowCreateModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleImport = async (url: string) => {
    if (!url.trim()) return;
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
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.playlist) {
        setPlaylists((p) => [...p, data.playlist]);
        setShowCreateModal(false);
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

  const handleToggleAddSearch = () => {
    if (showAddSearch) {
      setShowAddSearch(false);
      setModalSearchResults([]);
      setModalSearchQuery("");
    } else {
      setShowAddSearch(true);
      handleModalSearch("trending");
    }
  };

  return (
    <div className="h-screen relative overflow-hidden">
      <div className="flex justify-center items-center z-10 h-full w-full overflow-hidden">
        <div className="flex flex-col justify-center items-center h-full w-full">
          <div className="flex absolute z-50 top-4 right-5 items-center mt-2  backdrop-blur-2xl shadow-[0_4px_24px_-6px_rgba(0,0,0,0.4)] before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none before:to-transparent">
            <Profile size="md" />
          </div>

          <ScrollArea className="flex flex-col px-4 items-center justify-center h-full w-full">
            <div className="flex flex-wrap items-center justify-center content-center gap-6 py-16 w-full min-h-full">
              {loadingPlaylists
                ? Array.from({ length: 9 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))
                : playlists.map((playlist) => (
                    <PlaylistCard
                      key={playlist.id}
                      playlist={playlist}
                      onView={handleViewPlaylist}
                      onDelete={handleDeletePlaylist}
                    />
                  ))}

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

      <CreateImportPlaylistModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setImportError("");
        }}
        onCreate={handleCreate}
        onImport={handleImport}
        creating={creating}
        importing={importing}
        importError={importError}
      />

      {activePlaylist && (
        <PlaylistDetailModal
          playlist={activePlaylist}
          tracks={activeTracks}
          loading={loadingTracks}
          showAddSearch={showAddSearch}
          searchQuery={modalSearchQuery}
          searchResults={modalSearchResults}
          isSearching={isSearchingModal}
          addingTrackId={addingTrackId}
          onClose={handleCloseDetailsModal}
          onQueueAll={handleQueueAll}
          onDeleteTrack={handleDeleteTrack}
          onToggleAddSearch={handleToggleAddSearch}
          onSearchChange={handleModalSearchChange}
          onSearch={handleModalSearch}
          onAddTrack={handleAddTrackToPlaylist}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          draggedIdx={draggedIdx}
          dragOverIdx={dragOverIdx}
        />
      )}
    </div>
  );
}
