"use client";

import { Loader2, Search, X } from "lucide-react";

interface Props {
  value: string;
  suggestions: string[];
  showSuggestions: boolean;
  isSearching: boolean;
  onInput: (val: string) => void;
  onSearch: (q: string) => void;
  onSuggestionSelect: (s: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  avatarUrl?: string;
  avatarLabel?: string;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  suggestions,
  showSuggestions,
  isSearching,
  onInput,
  onSearch,
  onSuggestionSelect,
  onFocus,
  onBlur,
  onKeyDown,
  avatarUrl,
  avatarLabel = "U",
  placeholder = "Search by title, artist or album...",
  className = "",
}: Props) {
  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2.5 rounded-[20px] border border-white/20 bg-white/10 px-3 py-2.5 text-white backdrop-blur-xl">
        <Search size={14} className="shrink-0 text-white/70" />
        <input
          type="text"
          value={value}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={"What do you want to listen to?"}
          className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-white/45"
          autoFocus
        />
        {isSearching ? (
          <Loader2 size={14} className="shrink-0 animate-spin text-white/70" />
        ) : value ? (
          <button
            type="button"
            onClick={() => {
              onInput("");
              onSearch("");
            }}
            className="rounded-full p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Clear search"
          >
            <X size={12} />
          </button>
        ) : null}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 text-[11px] font-semibold text-white">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={avatarLabel}
              className="h-full w-full object-cover"
            />
          ) : (
            avatarLabel.slice(0, 1).toUpperCase()
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="room-scroll absolute inset-x-0 top-full z-40 mt-2.5 max-h-56 overflow-y-auto rounded-[20px] border border-white/20 bg-slate-950/70 p-1.5 shadow-2xl backdrop-blur-xl">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestionSelect(s)}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Search size={12} className="text-white/45" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
