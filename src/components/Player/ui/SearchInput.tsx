"use client";

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
  placeholder = "Search songs, artists, albums…",
  className = "",
}: Props) {
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onInput(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className="w-full bg-zinc-900 border border-zinc-800 focus:border-green-500 text-white text-sm px-4 py-3 pr-10 rounded-xl outline-none transition-colors placeholder:text-zinc-700"
        autoFocus
      />

      {/* Loading / Clear Button */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {isSearching ? (
          <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        ) : value ? (
          <button
            onClick={() => {
              onInput("");
              onSearch("");
            }}
            className="text-zinc-600 hover:text-white text-xs transition-colors"
            aria-label="Clear search"
          >
            ✕
          </button>
        ) : null}
      </div>

      {/* Autocomplete Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden z-40 shadow-xl max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestionSelect(s)}
              className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-3"
            >
              <span className="text-zinc-600 text-xs">⌕</span>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
