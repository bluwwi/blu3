"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import { useAuth } from "@/hooks/useAuth";
import { usePlayerState } from "@/hooks/usePlayerState";
import { useProgressTracking } from "@/hooks/useProgressTracking";
import { useSearch } from "@/hooks/useSearch";
import { useSuggestions } from "@/hooks/useSuggestions";
import { useYouTubeAPI } from "@/hooks/useYouTubeAPI";
import { YouTubeIframe } from "@/components/Player/ui/YouTubeIframe";
import { NowPlayingBar } from "@/components/Player/ui/NowPlayingBar";
import { Track } from "@/utils/types";
import { SearchTab } from "@/components/Player/ui/SearchTab";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string)?.toUpperCase();

  const { user, loading: authLoading } = useAuth();
  const { room, joinRoom, leaveRoom } = useRoom();
  const playerState = usePlayerState();
  const progressState = useProgressTracking(
    playerState.playerRef,
    playerState.playerState,
  );
  const searchState = useSearch();
  const suggestState = useSuggestions(API_URL);
  useYouTubeAPI();

  const [chatInput, setChatInput] = useState("");
  const [joined, setJoined] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevPlayerStateRef = useRef<string>("idle");

  const isHost = room?.hostId === user?.sub;

  const {
    connected,
    members,
    messages,
    recentTracks,
    sendChat,
    sendPlay,
    sendPause,
    sendSeek,
  } = useRoomSocket({
    roomCode: joined ? code : null,
    onPlaybackPlay: (state) => {
      if (canControlPlayback) return; // host/controller controls their own player
      if (state.videoId) {
        let actualCurrentTime = state.currentTime ?? 0;
        if (state.updatedAt) {
          const elapsed = (Date.now() - state.updatedAt) / 1000;
          if (elapsed > 0 && elapsed < 3600) {
            actualCurrentTime += elapsed;
          }
        }

        if (playerState.nowPlaying?.videoId === state.videoId) {
          playerState.play?.();
          progressState.seekTo(actualCurrentTime);
        } else {
          playerState.playTrack(
            {
              id: `room-${state.videoId}`,
              videoId: state.videoId,
              name: state.trackName,
              duration_ms: 0,
              explicit: false,
              artists: [{ name: state.artistName }],
              album: { name: "" },
              image: state.image,
            },
            actualCurrentTime,
            true
          );
        }
      }
    },
    onPlaybackPause: (t) => {
      if (!canControlPlayback) {
        playerState.pause?.();
        if (typeof t === "number") {
          progressState.seekTo(t);
        }
      }
    },
    onPlaybackSeek: (t) => {
      if (!canControlPlayback) progressState.seekTo(t);
    },
    onPlaybackSync: (state) => {
      if (canControlPlayback || !state.videoId) return;

      let actualCurrentTime = state.currentTime ?? 0;
      if (state.isPlaying && state.updatedAt) {
        const elapsed = (Date.now() - state.updatedAt) / 1000;
        if (elapsed > 0 && elapsed < 3600) {
          actualCurrentTime += elapsed;
        }
      }

      if (playerState.nowPlaying?.videoId === state.videoId) {
        if (state.isPlaying) {
          playerState.play?.();
        } else {
          playerState.pause?.();
        }
        progressState.seekTo(actualCurrentTime);
      } else {
        playerState.playTrack(
          {
            id: `room-${state.videoId}`,
            videoId: state.videoId,
            name: state.trackName,
            duration_ms: 0,
            explicit: false,
            artists: [{ name: state.artistName }],
            album: { name: "" },
            image: state.image,
          },
          actualCurrentTime,
          state.isPlaying
        );
      }
    },
  });

  const isHostPresent = room?.hostId ? members.some((m) => m.userId === room.hostId) : false;
  const canControlPlayback = isHost || !isHostPresent;

  const handleSeekAction = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canControlPlayback || !progressState.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const seekToTime = ((e.clientX - rect.left) / rect.width) * progressState.duration;
    progressState.seekTo(seekToTime);
    sendSeek(seekToTime);
  };

  // Auto join room on page load
  useEffect(() => {
    if (authLoading || !user || !code) return;
    // If we already have this room in state, skip REST call
    if (room?.code === code) {
      setJoined(true);
      return;
    }
    joinRoom(code).then((r) => {
      if (r) setJoined(true);
      else router.replace("/browse");
    });
  }, [authLoading, user, code]);

  // Redirect to login if not authed
  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [authLoading, user]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Host: sync playback to room when track changes
  useEffect(() => {
    if (!canControlPlayback || !joined) return;
    const v = playerState.nowPlaying;
    if (!v?.videoId) return;
    sendPlay({
      videoId: v.videoId,
      trackName: v.name,
      artistName: v.artists?.[0]?.name ?? "",
      image: v.image ?? "",
      currentTime: 0,
    });
  }, [playerState.nowPlaying?.videoId]);

  // Host: sync pause & resume
  useEffect(() => {
    if (!canControlPlayback || !joined) return;

    const prev = prevPlayerStateRef.current;
    prevPlayerStateRef.current = playerState.playerState;

    if (playerState.playerState === "paused") {
      sendPause(progressState.currentTime);
    }
    if (playerState.playerState === "playing" && playerState.nowPlaying) {
      // Only sync play if we are resuming from a paused state
      if (prev === "paused") {
        sendPlay({
          videoId: playerState.nowPlaying.videoId!,
          trackName: playerState.nowPlaying.name,
          artistName: playerState.nowPlaying.artists?.[0]?.name ?? "",
          image: playerState.nowPlaying.image ?? "",
          currentTime: progressState.currentTime,
        });
      }
    }
  }, [playerState.playerState]);

  const handleLeave = () => {
    leaveRoom();
    router.replace("/browse");
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendChat(chatInput.trim());
    setChatInput("");
  };

  if (authLoading || !joined) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <p className="text-zinc-500 text-sm font-mono tracking-widest animate-pulse">
          joining room...
        </p>
      </div>
    );
  }

  return (
    <>
      <YouTubeIframe />
      <div
        className="min-h-screen bg-[#080808] text-white flex flex-col"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap"
          rel="stylesheet"
        />

        {playerState.playerState !== "idle" && (
          <NowPlayingBar
            track={playerState.nowPlaying}
            activeVideoId={playerState.activeVideoId}
            playerState={playerState.playerState}
            progress={progressState.progress}
            currentTime={progressState.currentTime}
            duration={progressState.duration}
            volume={playerState.volume}
            isMuted={playerState.isMuted}
            onPlayPause={playerState.togglePlayPause}
            onMute={playerState.toggleMute}
            onVolume={playerState.handleVolume}
            onSeek={canControlPlayback ? handleSeekAction : undefined}
          />
        )}

        <div className="flex h-screen overflow-hidden pt-0">
          {/* Left — Search (host only) or Now Playing (guest) */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Room header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60">
              <div className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-zinc-600"}`}
                />
                <span
                  className="font-bold text-lg tracking-tight"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  {room?.name}
                </span>
                <span className="text-xs text-zinc-600 tracking-widest border border-zinc-800 rounded px-2 py-0.5">
                  {code}
                </span>
                {isHost && (
                  <span className="text-[10px] text-zinc-400 border border-zinc-700 rounded px-1.5 py-0.5 tracking-widest uppercase">
                    host
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(window.location.href)
                  }
                  className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 rounded px-3 py-1.5 transition-colors tracking-widest uppercase"
                >
                  copy invite
                </button>
                <button
                  onClick={handleLeave}
                  className="text-xs text-red-500 hover:text-red-400 border border-red-900/40 hover:border-red-700 rounded px-3 py-1.5 transition-colors tracking-widest uppercase"
                >
                  leave
                </button>
              </div>
            </div>

            {/* Search — everyone can search, only host controls playback */}
            <div className="flex-1 overflow-y-auto px-6 py-4 max-w-2xl w-full mx-auto">
              {!canControlPlayback ? (
                <div className="mb-4 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-500 tracking-wide flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span>🎵 synced to host — music plays automatically</span>
                </div>
              ) : !isHost ? (
                <div className="mb-4 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-400 tracking-wide flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" />
                  <span>⚡ Collaborative Mode: Room admin is away. You can play, pause and control the music!</span>
                </div>
              ) : null}
              <SearchTab
                recentTracks={recentTracks}
                searchQuery={searchState.searchQuery}
                suggestions={suggestState.suggestions}
                showSuggestions={suggestState.showSuggestions}
                results={searchState.results}
                isSearching={searchState.isSearching}
                searchError={searchState.searchError}
                activeTrackId={playerState.nowPlaying?.id ?? null}
                loadingTrackId={playerState.loadingId}
                isPlaying={playerState.playerState === "playing"}
                onSearchInput={searchState.onSearchInput}
                onSearch={searchState.doSearch}
                onSuggestionSelect={(s) => {
                  searchState.setSearchQuery(s);
                  searchState.doSearch(s);
                  suggestState.hideSuggestions();
                }}
                onTrackSelect={canControlPlayback ? playerState.playTrack : undefined}
                onFocus={() =>
                  suggestState.suggestions.length > 0 &&
                  suggestState.setShowSuggestions(true)
                }
                onBlur={() =>
                  setTimeout(() => suggestState.hideSuggestions(), 200)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    searchState.doSearch(searchState.searchQuery);
                    suggestState.hideSuggestions();
                  }
                  if (e.key === "Escape") suggestState.hideSuggestions();
                }}
              />
            </div>
          </div>

          {/* Right — Members + Chat */}
          <div className="w-80 border-l border-zinc-800/60 flex flex-col">
            {/* Members */}
            <div className="px-4 py-3 border-b border-zinc-800/40">
              <p className="text-[10px] text-zinc-600 tracking-widest uppercase mb-2">
                {members.length} listening
              </p>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <div key={m.userId} className="flex items-center gap-1.5">
                    {m.avatar ? (
                      <img
                        src={m.avatar}
                        className="w-6 h-6 rounded-full border border-zinc-700"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px]">
                        {m.name[0]}
                      </div>
                    )}
                    <span className="text-xs text-zinc-400">
                      {m.name.split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-none">
              {messages.length === 0 && (
                <p className="text-xs text-zinc-700 text-center mt-8 tracking-wide">
                  no messages yet
                </p>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2">
                  {msg.avatar ? (
                    <img
                      src={msg.avatar}
                      className="w-5 h-5 rounded-full mt-0.5 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] flex-shrink-0">
                      {msg.name[0]}
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] text-zinc-500 mr-1.5">
                      {msg.name.split(" ")[0]}
                    </span>
                    <span className="text-xs text-zinc-300">{msg.text}</span>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <div className="flex gap-2 px-3 py-3 border-t border-zinc-800">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="say something..."
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              />
              <button
                onClick={handleSendChat}
                className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs text-zinc-300 transition-colors"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
