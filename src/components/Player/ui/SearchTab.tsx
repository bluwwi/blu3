"use client";

import { Track } from "@/utils/types";
import { SearchInput } from "./SearchInput";
import { TrackList } from "./TrackList";

interface Props {
  searchQuery: string;
  suggestions: string[];
  showSuggestions: boolean;
  results: Track[];
  isSearching: boolean;
  searchError: string;

  // Player state
  activeTrackId: string | null;
  loadingTrackId: string | null;
  isPlaying: boolean;

  // Handlers
  onSearchInput: (val: string) => void;
  onSearch: (q: string) => void;
  onSuggestionSelect: (s: string) => void;
  onTrackSelect?: (track: Track) => void;
  onAddToQueue?: (track: Track) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function SearchTab({
  searchQuery,
  suggestions,
  showSuggestions,
  results,
  isSearching,
  searchError,
  activeTrackId,
  loadingTrackId,
  isPlaying,
  onSearchInput,
  onSearch,
  onSuggestionSelect,
  onTrackSelect,
  onAddToQueue,
  onFocus,
  onBlur,
  onKeyDown,
}: Props) {
  return (
    <div>
      <SearchInput
        value={searchQuery}
        suggestions={suggestions}
        showSuggestions={showSuggestions}
        isSearching={isSearching}
        onInput={onSearchInput}
        onSearch={onSearch}
        onSuggestionSelect={onSuggestionSelect}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />

      {(searchQuery || results.length > 0) && (
        <TrackList
          tracks={results}
          activeTrackId={activeTrackId}
          loadingTrackId={loadingTrackId}
          isPlaying={isPlaying}
          onTrackSelect={onTrackSelect}
          onAddToQueue={onAddToQueue}
          isSearching={isSearching}
          searchQuery={searchQuery}
          searchError={searchError}
        />
      )}
    </div>
  );
}
