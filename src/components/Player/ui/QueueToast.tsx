"use client";

interface QueueToastData {
  playlistName: string;
  image: string;
  trackCount: number;
}

interface Props {
  data: QueueToastData;
}

export function QueueToast({ data }: Props) {
  return (
    <div className="fixed top-24 right-4 lg:right-[calc(50%-35rem)] z-50 animate-in slide-in-from-right-4 fade-in duration-300">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/[0.12] bg-white/[0.06] backdrop-blur-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]">
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/10">
          {data.image ? (
            <img
              src={data.image}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold truncate max-w-[200px]">
            {data.playlistName}
          </p>
          <p className="text-white/50 text-xs">
            {data.trackCount} track
            {data.trackCount !== 1 ? "s" : ""} queued
          </p>
        </div>
      </div>
    </div>
  );
}
