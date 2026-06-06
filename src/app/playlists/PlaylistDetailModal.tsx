"use client";

import { ScrollArea } from "@/components/ui/ScrollArea";
import {
  Music2,
  Loader2,
  GripVertical,
  Search,
  X,
  Plus,
  Play,
} from "lucide-react";

interface PlaylistTrack {
  id: string;
  videoId: string;
  trackName: string;
  artistName: string;
  image: string;
  durationMs: number;
}

interface Props {
  playlist: {
    id: string;
    name: string;
    isLiked: boolean;
    coverImage?: string;
  };
  tracks: PlaylistTrack[];
  loading: boolean;
  showAddSearch: boolean;
  searchQuery: string;
  searchResults: any[];
  isSearching: boolean;
  addingTrackId: string | null;
  onClose: () => void;
  onQueueAll: () => void;
  onDeleteTrack: (trackId: string) => void;
  onToggleAddSearch: () => void;
  onSearchChange: (val: string) => void;
  onSearch: (q: string) => void;
  onAddTrack: (track: any) => void;
  onDragStart: (e: React.DragEvent, idx: number) => void;
  onDragOver: (e: React.DragEvent, idx: number) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, targetIdx: number) => void;
  draggedIdx: number | null;
  dragOverIdx: number | null;
}

export default function PlaylistDetailModal({
  playlist,
  tracks,
  loading,
  showAddSearch,
  searchQuery,
  searchResults,
  isSearching,
  addingTrackId,
  onClose,
  onQueueAll,
  onDeleteTrack,
  onToggleAddSearch,
  onSearchChange,
  onSearch,
  onAddTrack,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  draggedIdx,
  dragOverIdx,
}: Props) {
  return (
    <div
      className="modal-backdrop fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box w-full max-w-2xl mx-auto rounded-[24px] flex flex-col bg-white/[0.05] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] overflow-hidden relative before:absolute before:inset-0 before:rounded-[24px] before:pointer-events-none before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent h-[85vh]">
        {/* Header */}
        <div className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.06] shrink-0 relative z-10">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/[0.05] border border-white/[0.08] shrink-0">
            {playlist.coverImage ? (
              <img
                src={playlist.coverImage}
                className="w-full h-full object-cover"
                alt=""
              />
            ) : playlist.isLiked ? (
              <img
                src="/queue/finalheart.jpg"
                className="w-full h-full object-cover"
                alt=""
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music2 size={16} className="text-white/20" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-white truncate tracking-tight">
              {playlist.name}
            </h2>
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">
              {tracks.length} song{tracks.length !== 1 && "s"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!playlist.isLiked && (
              <button
                onClick={onToggleAddSearch}
                className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 transition-all cursor-pointer"
                title="Add tracks"
              >
                <Plus size={12} />
              </button>
            )}
            {tracks.length > 0 && (
              <button
                onClick={onQueueAll}
                className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 transition-all cursor-pointer"
                title="Queue all"
              >
                <Play size={12} className="fill-current ml-0.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 transition-all cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Track list */}
        <ScrollArea className="flex-1 min-h-0 relative z-10">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-zinc-500" size={20} />
            </div>
          ) : tracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600 py-12">
              <Music2 size={30} className="text-zinc-700 mb-3" />
              <p className="text-xs font-bold text-zinc-500">
                No tracks yet
              </p>
              <p className="text-[10px] text-zinc-600 mt-1 max-w-xs text-center leading-relaxed">
                {playlist.isLiked
                  ? "Heart tracks in rooms to populate this."
                  : "Hit + to search and add tracks."}
              </p>
            </div>
          ) : (
            <div className="px-3 py-2">
              {tracks.map((track, idx) => (
                <div
                  key={track.id}
                  draggable={!playlist.isLiked ? "true" : "false"}
                  onDragStart={(e) => onDragStart(e, idx)}
                  onDragOver={(e) => onDragOver(e, idx)}
                  onDragEnd={onDragEnd}
                  onDrop={(e) => onDrop(e, idx)}
                  className={`group/track flex items-center gap-3 px-3 py-2 rounded-xl transition-colors
                    ${!playlist.isLiked ? "cursor-grab active:cursor-grabbing" : ""}
                    ${draggedIdx === idx ? "opacity-20" : ""}
                    ${
                      dragOverIdx === idx && draggedIdx !== idx
                        ? "bg-white/[0.08] border border-white/10"
                        : "border border-transparent hover:bg-white/[0.04]"
                    }`}
                >
                  {!playlist.isLiked && (
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
                  {!playlist.isLiked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTrack(track.id);
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
        {!playlist.isLiked && showAddSearch && (
          <div className="shrink-0 border-t border-white/[0.06] relative z-10">
            <div className="flex flex-col max-h-[280px]">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                <Search size={12} className="text-zinc-500 shrink-0" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && onSearch(searchQuery)
                  }
                  placeholder="search songs to add..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none"
                />
                {isSearching ? (
                  <Loader2
                    size={12}
                    className="animate-spin text-zinc-500 shrink-0"
                  />
                ) : (
                  <button
                    onClick={onToggleAddSearch}
                    className="text-zinc-500 hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <ScrollArea className="flex flex-col px-2 py-1.5">
                {searchResults.length === 0 && !isSearching && (
                  <div className="flex items-center justify-center py-6">
                    <p className="text-[9px] text-zinc-700 uppercase tracking-widest">
                      type to search...
                    </p>
                  </div>
                )}
                {searchResults.map((track) => {
                  const alreadyAdded = tracks.some(
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
                        onClick={() => onAddTrack(track)}
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
  );
}
