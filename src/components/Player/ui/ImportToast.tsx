"use client";
import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle, X } from "lucide-react";

export type ImportStatus =
  | { type: "idle" }
  | { type: "importing"; message?: string }
  | { type: "done"; trackCount: number }
  | { type: "error"; error: string };

interface Props {
  status: ImportStatus;
  onDismiss: () => void;
}

export function ImportToast({ status, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status.type === "idle") {
      setVisible(false);
      return;
    }
    setVisible(true);
    if (status.type === "done" || status.type === "error") {
      const t = setTimeout(
        () => {
          setVisible(false);
          onDismiss();
        },
        status.type === "done" ? 4000 : 6000,
      );
      return () => clearTimeout(t);
    }
  }, [status, onDismiss]);

  if (!visible || status.type === "idle") return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="flex items-center gap-3 px-4 py-3 min-w-[280px] rounded-2xl border border-white/[0.12] bg-black backdrop-blur-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]">
        {status.type === "importing" && (
          <>
            <Loader2
              size={18}
              className="text-violet-400 animate-spin shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-white/90">Importing playlist...</p>
              <div className="mt-1 h-1 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-1/2 rounded-full bg-violet-400 animate-pulse" />
              </div>
            </div>
          </>
        )}

        {status.type === "done" && (
          <>
            <CheckCircle2 size={18} className="text-green-400 shrink-0" />
            <p className="flex-1 text-[13px] text-white/90">
              Imported {status.trackCount} tracks
            </p>
            <button
              onClick={() => {
                setVisible(false);
                onDismiss();
              }}
              className="text-white/40 hover:text-white/80"
            >
              <X size={14} />
            </button>
          </>
        )}

        {status.type === "error" && (
          <>
            <XCircle size={18} className="text-red-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-red-300">{status.error}</p>
            </div>
            <button
              onClick={() => {
                setVisible(false);
                onDismiss();
              }}
              className="text-white/40 hover:text-white/80 shrink-0"
            >
              <X size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
