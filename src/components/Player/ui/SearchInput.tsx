"use client";

import { T } from "@/utils/roomHelpers";

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
        style={{
          width: "100%",
          background: T.surface2,
          border: `1px solid ${T.border}`,
          color: T.text,
          fontSize: "14px",
          padding: "12px 40px 12px 16px",
          borderRadius: "12px",
          outline: "none",
          transition: "all 0.15s",
        }}
        autoFocus
      />

      {/* Loading / Clear Button */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {isSearching ? (
          <div
            style={{
              width: "16px",
              height: "16px",
              border: `2px solid ${T.purple}`,
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        ) : value ? (
          <button
            onClick={() => {
              onInput("");
              onSearch("");
            }}
            style={{
              color: T.text3,
              fontSize: "12px",
              transition: "color 0.15s",
            }}
            aria-label="Clear search"
          >
            ✕
          </button>
        ) : null}
      </div>

      {/* Autocomplete Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: "12px",
            overflow: "hidden",
            zIndex: 40,
            boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            maxHeight: "240px",
            overflowY: "auto",
          }}
          className="room-scroll"
        >
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestionSelect(s)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 16px",
                fontSize: "13px",
                color: T.text2,
                background: "transparent",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
              }}
            >
              <span style={{ color: T.text3, fontSize: "12px" }}>⌕</span>
              {s}
            </button>
          ))}
        </div>
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
