"use client";

import { useEffect, useRef } from "react";
import { QueueAndHistory } from "@/components/Player/ui/QueueAndHistory";
import { SearchTab } from "@/components/Player/ui/SearchTab";
import { RoomTheme, T } from "@/utils/roomHelpers";
import { Track } from "@/utils/types";

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
}

const iconButtonStyle: React.CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "10px",
  border: `1px solid ${T.buttonBorder}`,
  background: T.buttonBg,
  color: T.buttonText,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "16px",
  flexShrink: 0,
};

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
}: Props) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const themeOptions: Array<{ id: RoomTheme; label: string }> = [
    { id: "purple", label: "Lilac" },
    { id: "mono", label: "Mono" },
    { id: "yellow", label: "Gold" },
  ];

  useEffect(() => {
    if (chatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatOpen, messages]);

  return (
    <div
      style={{
        borderLeft: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        background: T.surface,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          padding: "16px",
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            marginBottom: "14px",
          }}
        >
          <button
            type="button"
            onClick={onOpenSearch}
            style={{
              flex: 1,
              height: "38px",
              borderRadius: "10px",
              border: `1px solid ${T.buttonBorder}`,
              background: T.buttonBg,
              color: T.buttonText,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "0 12px",
              fontFamily: T.font,
              fontSize: "11px",
              letterSpacing: "0.08em",
            }}
          >
            <span style={{ color: T.buttonText }}>⌕</span>
            <span>Search Songs</span>
          </button>
          <button
            type="button"
            onClick={onOpenChat}
            aria-label="Open chat"
            style={iconButtonStyle}
          >
            💬
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "14px",
          }}
        >
          {themeOptions.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => onThemeChange(theme.id)}
              style={{
                flex: 1,
                height: "34px",
                borderRadius: "10px",
                border:
                  roomTheme === theme.id
                    ? `1px solid ${T.purple}`
                    : `1px solid ${T.buttonBorder}`,
                background:
                  roomTheme === theme.id ? T.purpleGhost : T.buttonBg,
                color: roomTheme === theme.id ? T.purpleLight : T.buttonText,
                cursor: "pointer",
                fontSize: "11px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {theme.label}
            </button>
          ))}
        </div>

        <p
          style={{
            fontSize: "9px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: T.text3,
            marginBottom: "10px",
          }}
        >
          {members.length} listening
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {members.map((member) => (
            <div
              key={member.userId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 8px",
                borderRadius: "999px",
                background: T.surface2,
                border: `1px solid ${T.border2}`,
              }}
            >
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt=""
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    border: `1px solid ${T.border}`,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: T.purpleDim,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    color: T.purpleLight,
                    border: `1px solid rgba(106,90,205,0.3)`,
                    flexShrink: 0,
                  }}
                >
                  {member.name[0]}
                </div>
              )}
              <span style={{ fontSize: "11px", color: T.text2 }}>
                {member.name.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}
        className="room-scroll"
      >
        <QueueAndHistory
          queue={queue}
          recentTracks={recentTracks}
          canControlPlayback={canControlPlayback}
          handleAdminPlayTrack={handleAdminPlayTrack}
          removeFromQueue={removeFromQueue}
          addToQueue={addToQueue}
          activeVideoId={activeVideoId}
        />
      </div>

      {searchOpen && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(5,5,8,0.96)",
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "14px",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: T.text2,
              }}
            >
              Search Songs
            </p>
            <button
              type="button"
              onClick={onCloseSearch}
              style={iconButtonStyle}
              aria-label="Close search"
            >
              ✕
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }} className="room-scroll">
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
            />
          </div>
        </div>
      )}

      {chatOpen && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(5,5,8,0.96)",
            zIndex: 30,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px",
              borderBottom: `1px solid ${T.border}`,
              flexShrink: 0,
            }}
          >
            <p
              style={{
                fontSize: "10px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: T.text2,
              }}
            >
              Room Chat
            </p>
            <button
              type="button"
              onClick={onCloseChat}
              style={iconButtonStyle}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div
            style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}
            className="room-scroll"
          >
            {messages.length === 0 && (
              <p
                style={{
                  fontSize: "11px",
                  color: T.text3,
                  textAlign: "center",
                  marginTop: "30px",
                }}
              >
                no messages yet
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                {msg.avatar ? (
                  <img
                    src={msg.avatar}
                    alt=""
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      marginTop: "1px",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: T.surface3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "9px",
                      color: T.text3,
                      flexShrink: 0,
                    }}
                  >
                    {msg.name[0]}
                  </div>
                )}
                <div>
                  <span
                    style={{
                      fontSize: "10px",
                      color: T.text3,
                      marginRight: "6px",
                    }}
                  >
                    {msg.name.split(" ")[0]}
                  </span>
                  <span style={{ fontSize: "11px", color: T.text2 }}>
                    {msg.text}
                  </span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              padding: "10px 12px",
              borderTop: `1px solid ${T.border}`,
              flexShrink: 0,
            }}
          >
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              placeholder="say something..."
              style={{
                flex: 1,
                background: T.surface2,
                border: `1px solid ${T.border}`,
                color: T.text,
                fontSize: "11px",
                padding: "8px 12px",
                borderRadius: "8px",
                outline: "none",
                fontFamily: T.font,
              }}
            />
            <button
              type="button"
              onClick={handleSendChat}
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                border: `1px solid ${T.buttonBorder}`,
                background: T.buttonBg,
                color: T.buttonText,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                transition: "all 0.15s",
              }}
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
