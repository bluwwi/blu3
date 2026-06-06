"use client";

import { Trash2, Music2 } from "lucide-react";
import Image from "next/image";

interface PlaylistInfo {
  id: string;
  name: string;
  isLiked: boolean;
  createdAt: string;
  coverImage?: string;
  trackCount?: number;
}

interface Props {
  playlist: PlaylistInfo;
  onView: (playlist: PlaylistInfo) => void;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
}

export function PlaylistCard({ playlist, onView, onDelete }: Props) {
  const hasCover = playlist.coverImage && playlist.coverImage.trim().length > 0;

  return (
    <div
      className="room-card flex flex-col gap-2 relative group/card w-28 sm:w-32 md:w-36 lg:w-40 cursor-pointer"
      onClick={() => onView(playlist)}
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
          <Image
            width={400}
            height={400}
            src="/queue/finalheart.jpg"
            alt={playlist.name}
            className="room-card-img rounded-md w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full rounded-md bg-white/5 border border-white/[0.08] flex items-center justify-center">
            <Music2 size={20} className="text-white/15" />
          </div>
        )}

        <div className="room-play-overlay hover:border-2 border-white rounded-md cursor-pointer absolute inset-0 flex items-center justify-center" />

        {!playlist.isLiked && (
          <button
            onClick={(e) => onDelete(e, playlist.id, playlist.name)}
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
            <span className="text-zinc-500"> • {playlist.trackCount}</span>
          )}
        </p>
      </div>
    </div>
  );
}
