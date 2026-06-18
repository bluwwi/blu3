"use client";
import { Track } from "@/utils/types";
import { Trash2 } from "lucide-react";

interface Props {
  queue: Track[];
  selectedIds: Set<string>;
  onDeleteSelected: () => void;
  onSelectAll: () => void;
}

export function QueueManageBar({
  queue,
  selectedIds,
  onDeleteSelected,
  onSelectAll,
}: Props) {
  return (
    <div className="flex pl-3 py-0 pr-5 sm:pr-6 items-center justify-between">
      <div className="flex  items-center gap-2">
        <button
          onClick={onDeleteSelected}
          style={{
            width: "clamp(3.5rem,3vw,199rem)",
          }}
          disabled={selectedIds.size === 0}
          className="flex aspect-square    items-center cursor-pointer justify-center gap-2 rounded-lg bg-[#C0392B] text-sm text-white transition-all hover:bg-[#C0392B]/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 size={20} />
        </button>

        <div className="min-w-0 flex-1">
          <p
            className="truncate font-medium text-white"
            style={{
              fontSize: "clamp(0.85rem,0.75vw,199rem)",
            }}
          >
            Delete Selected
          </p>
          <p className="truncate text-[11px] text-white/60">
            {selectedIds.size > 0 ? ` (${selectedIds.size})` : "(0)"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 ">
        <div
          onClick={onSelectAll}
          className="flex items-center gap-2 text-sm text-white/80 cursor-pointer select-none"
        >
          <div
            className={`flex h-6 w-6 items-center justify-center rounded border-2 transition-all cursor-pointer ${
              selectedIds.size === queue.length
                ? "bg-blue-100 border-blue-100"
                : "border-white/40 hover:border-white/70"
            }`}
          >
            {selectedIds.size === queue.length && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="black"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
