"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  onImport: (url: string) => Promise<void>;
  creating: boolean;
  importing: boolean;
  importError: string;
}

export default function CreateImportPlaylistModal({
  open,
  onClose,
  onCreate,
  onImport,
  creating,
  importing,
  importError,
}: Props) {
  const [tab, setTab] = useState<"create" | "import">("create");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  if (!open) return null;

  const handleClose = () => {
    onClose();
    setName("");
    setUrl("");
    setTab("create");
  };

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !importing && !creating)
          handleClose();
      }}
    >
      <div className="modal-box w-full max-w-sm mx-4 rounded-[24px] p-6 bg-white/[0.05] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] relative overflow-hidden before:absolute before:inset-0 before:rounded-[24px] before:pointer-events-none before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent">
        <div className="flex items-center gap-1 mb-5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] relative z-10">
          <button
            onClick={() => setTab("create")}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer ${
              tab === "create"
                ? "bg-white text-black"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            create
          </button>
          <button
            onClick={() => setTab("import")}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer ${
              tab === "import"
                ? "bg-white text-black"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            import
          </button>
        </div>

        {tab === "create" && (
          <>
            <p className="text-[11px] text-zinc-500 tracking-widest mb-4 relative z-10 uppercase">
              give it a name
            </p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onCreate(name);
                if (e.key === "Escape") handleClose();
              }}
              placeholder="playlist name..."
              maxLength={40}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 tracking-wide mb-4 focus:outline-none focus:border-white/25 transition-colors relative z-10"
            />
            <div className="flex gap-2 relative z-10">
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-lg border border-white/10 text-zinc-500 text-[11px] tracking-widest uppercase font-bold hover:border-white/20 hover:text-zinc-300 transition-all cursor-pointer"
              >
                cancel
              </button>
              <button
                onClick={() => onCreate(name)}
                disabled={!name.trim() || creating}
                className="flex-1 py-2.5 rounded-lg bg-white text-black text-[11px] font-bold tracking-widest uppercase hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                {creating ? "creating..." : "create"}
              </button>
            </div>
          </>
        )}

        {tab === "import" && (
          <>
            <p className="text-[11px] text-zinc-500 tracking-widest mb-4 relative z-10 uppercase">
              spotify · youtube · apple music
            </p>
            <input
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={importing}
              onKeyDown={(e) => e.key === "Enter" && onImport(url)}
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
                onClick={handleClose}
                disabled={importing}
                className="flex-1 py-2.5 rounded-lg border border-white/10 text-zinc-500 text-[11px] tracking-widest uppercase font-bold hover:border-white/20 hover:text-zinc-300 transition-all disabled:opacity-30 cursor-pointer"
              >
                cancel
              </button>
              <button
                onClick={() => onImport(url)}
                disabled={!url.trim() || importing}
                className="flex-1 py-2.5 rounded-lg bg-white text-black text-[11px] font-bold tracking-widest uppercase hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                {importing ? "importing..." : "import"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
