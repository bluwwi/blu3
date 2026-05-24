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
      <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white backdrop-blur-xl">
        <Search size={16} className="shrink-0 text-white/70" />
        <input
          type="text"
          value={value}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/45"
          autoFocus
        />
        {isSearching ? (
          <Loader2 size={16} className="shrink-0 animate-spin text-white/70" />
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
            <X size={14} />
          </button>
        ) : null}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 text-xs font-semibold text-white">
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
        <div
          className="room-scroll absolute inset-x-0 top-full z-40 mt-3 max-h-60 overflow-y-auto rounded-2xl border border-white/20 bg-slate-950/70 p-2 shadow-2xl backdrop-blur-xl"
        >
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestionSelect(s)}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Search size={14} className="text-white/45" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
