"use client";

interface Props {
  message: string;
}

export function RoomErrorModal({ message }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
      <div className="flex flex-col items-center gap-4 px-8 py-6 rounded-3xl border border-white/20 bg-black/70 backdrop-blur-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]">
        <p className="text-white text-lg font-semibold text-center">
          {message}
        </p>
        <p className="text-white/50 text-sm">
          Redirecting to browse...
        </p>
      </div>
    </div>
  );
}
