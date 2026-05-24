"use client";

import { useEffect, useRef } from "react";
import { SearchTab } from "@/components/Player/ui/SearchTab";
import { RoomTheme } from "@/utils/roomHelpers";
import { Track } from "@/utils/types";
import {
  MessageSquare,
  Palette,
  Search,
  Send,
  Star,
  Users,
  X,
} from "lucide-react";

interface Member {
  userId: string;
  name: string;
  avatar?: string;
}

interface Message {
  id: string;
  name: string;
  text: string;
  avatar?: string;
}

interface RecentTrack {
  videoId: string;
  trackName: string;
  artistName: string;
  image: string;
  playedAt: number;
}

interface Props {
  members: Member[];
  messages: Message[];
  roomTheme: RoomTheme;
  onThemeChange: (theme: RoomTheme) => void;
  chatInput: string;
  setChatInput: (val: string) => void;
  handleSendChat: () => void;
  queue: Track[];
  recentTracks: RecentTrack[];
  canControlPlayback: boolean;
  handleAdminPlayTrack: (track: Track) => void;
  removeFromQueue: (id: string) => void;
  addToQueue: (track: Track) => void;
  activeVideoId: string | null | undefined;
  searchOpen: boolean;
  chatOpen: boolean;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onOpenChat: () => void;
  onCloseChat: () => void;
  searchQuery: string;
  suggestions: string[];
  showSuggestions: boolean;
  results: Track[];
  isSearching: boolean;
  searchError: string;
  activeTrackId: string | null;
  loadingTrackId: string | null;
  isPlaying: boolean;
  onSearchInput: (val: string) => void;
  onSearch: (q: string) => void;
  onSuggestionSelect: (s: string) => void;
  onTrackSelect?: (track: Track) => void;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  onSearchKeyDown: (e: React.KeyboardEvent) => void;
  userAvatar?: string;
  userLabel?: string;
}

export function RightSidebar({
  members,
  messages,
  roomTheme,
  onThemeChange,
  chatInput,
  setChatInput,
  handleSendChat,
  queue,
  recentTracks,
  canControlPlayback,
  handleAdminPlayTrack,
  removeFromQueue,
  addToQueue,
  activeVideoId,
  searchOpen,
  chatOpen,
  onOpenSearch,
  onCloseSearch,
  onOpenChat,
  onCloseChat,
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
  onSearchFocus,
  onSearchBlur,
  onSearchKeyDown,
  userAvatar,
  userLabel = "User",
}: Props) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const themeOptions: Array<{ id: RoomTheme; label: string }> = [
    { id: "purple", label: "Lilac" },
    { id: "mono", label: "Mono" },
    { id: "yellow", label: "Gold" },
  ];
  const playlistColors = [
    "bg-green-500",
    "bg-sky-400",
    "bg-orange-400",
    "bg-red-400",
    "bg-yellow-400",
    "bg-orange-300",
    "bg-pink-400",
    "bg-emerald-400",
  ];
  const playlists = [
    "Day at the Park",
    "Positivity",
    "Joy",
    "Starting Over",
    "Feeling Happy",
    "Morning Commute",
    "Feeling Confident",
    "Good News!",
  ];

  useEffect(() => {
    if (chatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatOpen, messages]);

  return (
    <div className="relative h-full rounded-[32px] border border-white/20 bg-white/10 p-6 text-white backdrop-blur-xl">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex flex-1 items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white/75 transition-colors hover:bg-white/15 hover:text-white"
          >
            <Search size={16} />
            <span>Search</span>
          </button>
          <button
            type="button"
            onClick={onOpenChat}
            aria-label="Open chat"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white/75 transition-colors hover:bg-white/15 hover:text-white"
          >
            <MessageSquare size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white/80">
            <Palette size={16} />
            <p className="text-sm font-medium">Room theme</p>
          </div>
          <div className="flex gap-2">
          {themeOptions.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => onThemeChange(theme.id)}
              className={`flex-1 rounded-full border px-3 py-2 text-xs transition-colors ${
                roomTheme === theme.id
                  ? "border-white/30 bg-white/20 text-white"
                  : "border-white/15 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {theme.label}
            </button>
          ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white/80">
            <Users size={16} />
            <p className="text-sm font-medium">{members.length} listening</p>
          </div>
          <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <div
              key={member.userId}
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-1.5"
            >
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[10px] text-white/80">
                  {member.name[0]}
                </div>
              )}
              <span className="text-xs text-white/80">
                {member.name.split(" ")[0]}
              </span>
            </div>
          ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Star size={16} className="text-white/80" />
            <h2 className="text-base font-medium">Popular playlists</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {playlists.map((playlist, index) => (
              <div
                key={playlist}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10"
              >
                <div
                  className={`h-10 w-10 shrink-0 rounded-xl ${playlistColors[index % playlistColors.length]}`}
                />
                <span className="text-sm text-white">{playlist}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="absolute inset-0 z-20 flex flex-col rounded-[32px] border border-white/20 bg-slate-950/70 p-6 backdrop-blur-2xl">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.28em] text-white/55">
              Search Songs
            </p>
            <button
              type="button"
              onClick={onCloseSearch}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white/75 transition-colors hover:bg-white/15 hover:text-white"
              aria-label="Close search"
            >
              <X size={16} />
            </button>
          </div>
          <div className="room-scroll flex-1 overflow-y-auto">
            <SearchTab
              searchQuery={searchQuery}
              suggestions={suggestions}
              showSuggestions={showSuggestions}
              results={results}
              isSearching={isSearching}
              searchError={searchError}
              activeTrackId={activeTrackId}
              loadingTrackId={loadingTrackId}
              isPlaying={isPlaying}
              onSearchInput={onSearchInput}
              onSearch={onSearch}
              onSuggestionSelect={onSuggestionSelect}
              onTrackSelect={onTrackSelect}
              onAddToQueue={addToQueue}
              onFocus={onSearchFocus}
              onBlur={onSearchBlur}
              onKeyDown={onSearchKeyDown}
              avatarUrl={userAvatar}
              avatarLabel={userLabel}
            />
          </div>
        </div>
      )}

      {chatOpen && (
        <div className="absolute inset-0 z-30 flex flex-col rounded-[32px] border border-white/20 bg-slate-950/75 backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <p className="text-xs uppercase tracking-[0.28em] text-white/55">
              Room Chat
            </p>
            <button
              type="button"
              onClick={onCloseChat}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white/75 transition-colors hover:bg-white/15 hover:text-white"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>

          <div className="room-scroll flex-1 overflow-y-auto px-6 py-4">
            {messages.length === 0 && (
              <p className="mt-8 text-center text-sm text-white/55">
                no messages yet
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="mb-3 flex items-start gap-3"
              >
                {msg.avatar ? (
                  <img
                    src={msg.avatar}
                    alt=""
                    className="mt-0.5 h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs text-white/70">
                    {msg.name[0]}
                  </div>
                )}
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="mr-2 text-xs text-white/45">
                    {msg.name.split(" ")[0]}
                  </span>
                  <span className="text-sm text-white/80">
                    {msg.text}
                  </span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-3 border-t border-white/10 px-6 py-4">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              placeholder="say something..."
              className="flex-1 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"
            />
            <button
              type="button"
              onClick={handleSendChat}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white/75 transition-colors hover:bg-white/15 hover:text-white"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
