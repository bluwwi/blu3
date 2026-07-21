"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import { useAuth } from "@/hooks/useAuth";
import { useRoomEngine } from "@/hooks/useRoomEngine";
import { resolveLink } from "@/utils/ytdl";

import { useSearch } from "@/hooks/useSearch";
import { useSuggestions } from "@/hooks/useSuggestions";
import { RoomTopBar } from "@/components/Player/ui/Roomtopbar";
import { RoomBackground } from "@/components/Player/ui/RoomBackground";
import { Track, PlayerState } from "@/utils/types";
import {
  asTrackFromPlayback,
  asTrackFromRecent,
  RoomTheme,
} from "@/utils/roomHelpers";
import { usePlaylists } from "@/hooks/usePlaylists";
import { RightSidebar } from "@/components/Player/ui/RightSidebar";
import { RoomLoading } from "@/components/Player/ui/RoomLoading";
import { SearchOverlay } from "@/components/Player/ui/SearchOverlay";
import { SquarePlayer } from "@/components/Player/ui/SquarePlayer";
import { RoomStars } from "@/components/Player/ui/RoomStars";
import { RoomTopSection } from "@/components/Player/ui/RoomTopSection";
import { RoomFooter } from "@/components/Player/ui/RoomFooter";
import { QueueToast } from "@/components/Player/ui/QueueToast";
import { RoomErrorModal } from "@/components/Player/ui/RoomErrorModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
type RepeatMode = "off" | "all" | "one";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queuePlaylistId = searchParams
    ? searchParams.get("queuePlaylistId")
    : null;
  const code = (params.code as string)?.toUpperCase();

  const { user, loading: authLoading, logout } = useAuth();
  const { room, joinRoom, leaveRoom } = useRoom();
  const { likedTrackIds, toggleLike } = usePlaylists();
  const searchState = useSearch();
  const suggestState = useSuggestions(API_URL);

  const [joined, setJoined] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [roomTheme, setRoomTheme] = useState<RoomTheme>("purple");
  const [listenerMuted, setListenerMuted] = useState(true);
  const [joinToasts, setJoinToasts] = useState<
    Array<{ id: string; name: string; avatar?: string }>
  >([]);
  const [queueToast, setQueueToast] = useState<{
    playlistName: string;
    image: string;
    trackCount: number;
  } | null>(null);
  const [joinErrorMessage, setJoinErrorMessage] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [starsMounted, setStarsMounted] = useState(false);

  useEffect(() => {
    setStarsMounted(true);
  }, []);

  const {
    state: roomState,
    displayTime,
    engine: roomEngine,
    hostPlay,
    hostPause,
    hostSeek,
    listenerToggle,
    toggleMute,
    addToQueue,
    removeFromQueue,
    clearQueue,
    sendChat,
    sendPlaybackMode,
    volume,
    isMuted,
    engineMode,
  } = useRoomEngine(joined ? code : null);

  const playback = roomState.playback;
  const queue = roomState.queue;
  const members = roomState.members;
  const chatMessages = roomState.chatMessages;
  const isHost = room?.hostId === user?.id || roomState.isHost;
  const isHostActive = roomState.isHostActive;
  const connected = roomState.connected;
  const initialDataLoaded = roomState.phase === "ready";
  const recentTracks = roomState.recentTracks;
  const playbackMode = roomState.playbackMode;

  const canControlPlayback = isHost || !isHostActive || user?.role === "admin";

  const token =
    typeof window !== "undefined"
      ? (localStorage.getItem("blu3_token") ?? undefined)
      : undefined;

  const isRejoinRef = useRef(false);

  useEffect(() => {
    if (authLoading || !user || !code) return;
    const lastRoom = localStorage.getItem("blu3_last_room");
    const isRejoin = lastRoom === code;
    isRejoinRef.current = isRejoin;
    if (room?.code === code) {
      setJoined(true);
      localStorage.setItem("blu3_last_room", code);
      return;
    }
    joinRoom(code).then((result) => {
      if (result?.room) {
        setJoined(true);
        localStorage.setItem("blu3_last_room", code);
      } else if (result?.error) {
        setJoinErrorMessage(result.error);
        setTimeout(() => router.replace("/browse"), 3000);
      } else {
        router.replace("/browse");
      }
    });
  }, [authLoading, user, code]);

  // ── Auto-queue playlist from URL param ────────────────────────────────────

  useEffect(() => {
    if (!connected || !joined || !queuePlaylistId) return;

    const token = localStorage.getItem("blu3_token");
    if (!token) return;

    fetch(`${API_URL}/api/playlists/${queuePlaylistId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.tracks && data.tracks.length > 0) {
          data.tracks.forEach((t: any) => {
            const source =
              t.source || (/^\d+$/.test(t.videoId) ? "jiosaavn" : "youtube");
            addToQueue({
              id: t.id,
              source,
              videoId: t.videoId,
              name: t.trackName,
              artists: [{ name: t.artistName }],
              album: { name: "" },
              image: t.image || "",
              duration_ms: t.durationMs || 0,
              explicit: false,
            });
          });
        }
        const coverImage = data.tracks?.find((t: any) => t.image)?.image || "";
        setQueueToast({
          playlistName: data.playlist?.name || "Imported Playlist",
          image: coverImage,
          trackCount: data.tracks?.length || 0,
        });
        setTimeout(() => setQueueToast(null), 4000);
      })
      .catch((err) => console.error("Failed to auto-queue playlist:", err))
      .finally(() => {
        router.replace(`/room/${code}`);
      });
  }, [connected, joined, queuePlaylistId, code, addToQueue, router]);

  // ── Derived display values ─────────────────────────────────────────────────

  const playbackTrack = asTrackFromPlayback(playback as any);
  const lastPlayedTrack = asTrackFromRecent(recentTracks[0]);

  const activeTrackLike = playbackTrack;
  const footerTrack = activeTrackLike ?? lastPlayedTrack;

  const nextTrack = useMemo(() => {
    const playingId = playback?.videoId;
    if (!playingId) return queue[0] || null;
    const idx = queue.findIndex(
      (t) => t.videoId === playingId,
    );
    if (idx >= 0 && idx + 1 < queue.length) return queue[idx + 1];
    if (idx >= 0 && playbackMode.repeatMode === "all") return queue[0];
    return queue[0] || null;
  }, [playback?.videoId, queue, playbackMode.repeatMode]);

  const derivePlayerState = (): PlayerState => {
    if (roomState.phase === "loading") return "loading";
    if (!playback?.videoId) return "idle";
    if (playback.isPlaying) return "playing";
    return "paused";
  };

  const playerState = derivePlayerState();
  const footerPlayerState = playerState === "idle" && playback?.videoId ? "loading" : playerState;

  const audioEngine = roomEngine?.audioEngine ?? null;
  const engineCurrentTime = audioEngine?.currentTime ?? 0;
  const engineDuration = audioEngine?.duration ?? 0;
  const engineProgress = engineDuration > 0 ? (engineCurrentTime / engineDuration) * 100 : 0;

  const displayCurrentTime = displayTime;

  const isLiked = playback?.videoId
    ? likedTrackIds.has(playback.videoId)
    : false;
  const handleToggleLike = useCallback(() => {
    if (playbackTrack) toggleLike(playbackTrack);
  }, [playbackTrack, toggleLike]);

  // ── Auto-prefetch next track ──────────────────────────────────────────────

  useEffect(() => {
    if (engineMode === "youtube" || queue.length <= 1) return;
    const playingId = playback?.videoId;
    if (!playingId) return;
    const currentIdx = queue.findIndex((t) => t.videoId === playingId);
    const nextTrack =
      currentIdx >= 0 && currentIdx + 1 < queue.length
        ? queue[currentIdx + 1]
        : queue[0];
    if (
      nextTrack &&
      nextTrack.videoId !== playingId &&
      audioEngine
    ) {
      audioEngine.prefetchNextTrack({
        videoId: nextTrack.videoId,
        source: nextTrack.source,
        name: nextTrack.name,
        artist: nextTrack.artists?.[0]?.name ?? "",
        durationMs: nextTrack.duration_ms,
      });
    }
  }, [engineMode, queue, playback?.videoId, audioEngine]);

  // ── Action handlers ───────────────────────────────────────────────────────

  const handleSeekAction = useCallback(
    (seekToTime: number) => {
      if (!canControlPlayback || !playback?.videoId) return;
      hostSeek(seekToTime);
    },
    [canControlPlayback, playback?.videoId, hostSeek],
  );

  const handlePlayPauseAction = useCallback(() => {
    if (!canControlPlayback) return;
    if (!playback?.videoId || playerState !== "playing") {
      const firstTrack = queue[0];
      if (!firstTrack) return;
      hostPlay(
        firstTrack.videoId, 0, firstTrack.duration_ms,
        firstTrack.source, firstTrack.name,
        firstTrack.artists?.[0]?.name ?? "", firstTrack.image,
      );
      return;
    }
    hostPause();
  }, [canControlPlayback, playback?.videoId, playerState, queue, hostPlay, hostPause]);

  const handleListenerPlay = useCallback(() => {
    listenerToggle();
    setListenerMuted((prev) => !prev);
  }, [listenerToggle]);

  const onPlayPauseAction = canControlPlayback
    ? handlePlayPauseAction
    : playback?.isPlaying
      ? handleListenerPlay
      : undefined;

  const handleAdminPlayTrack = useCallback(
    (track: Track) => {
      if (!canControlPlayback || !track.videoId) return;
      removeFromQueue(track.id);
      hostPlay(
        track.videoId, 0, track.duration_ms,
        track.source, track.name,
        track.artists?.[0]?.name ?? "", track.image,
      );
    },
    [canControlPlayback, hostPlay, removeFromQueue],
  );

  const handleSkipForward = useCallback(() => {
    if (!canControlPlayback || !joined) return;
    const playingId = playback?.videoId;
    if (!playingId) return;
    const currentIdx = queue.findIndex((t) => t.videoId === playingId);
    if (currentIdx === -1) return;
    const upcomingTracks = queue.slice(currentIdx + 1);
    const nextTrack =
      upcomingTracks.length > 0
        ? playbackMode.shuffle
          ? upcomingTracks[Math.floor(Math.random() * upcomingTracks.length)]
          : upcomingTracks[0]
        : playbackMode.repeatMode === "all"
          ? queue[0]
          : null;
    if (!nextTrack) return;
    removeFromQueue(nextTrack.id);
    hostPlay(
      nextTrack.videoId, 0, nextTrack.duration_ms,
      nextTrack.source, nextTrack.name,
      nextTrack.artists?.[0]?.name ?? "", nextTrack.image,
    );
  }, [canControlPlayback, joined, playback?.videoId, queue, playbackMode, hostPlay, removeFromQueue]);

  const handleSkipBack = useCallback(() => {
    if (!canControlPlayback || !joined) return;
    const currentTime = engineCurrentTime;
    if (currentTime > 3) {
      if (!playback?.videoId) return;
      hostSeek(0);
      return;
    }
    const playingId = playback?.videoId;
    if (!playingId) return;
    const currentIdx = queue.findIndex((t) => t.videoId === playingId);
    const prevIdx =
      currentIdx > 0
        ? currentIdx - 1
        : playbackMode.repeatMode === "all"
          ? queue.length - 1
          : -1;
    if (prevIdx < 0 || !queue[prevIdx]) {
      hostSeek(0);
      return;
    }
    const prevTrack = queue[prevIdx];
    hostPlay(
      prevTrack.videoId, 0, prevTrack.duration_ms,
      prevTrack.source, prevTrack.name,
      prevTrack.artists?.[0]?.name ?? "", prevTrack.image,
    );
  }, [canControlPlayback, joined, engineCurrentTime, playback?.videoId, queue, playbackMode.repeatMode, hostSeek, hostPlay]);

  const handleVolumeWrapped = useCallback(
    (val: number) => {
      // Volume is controlled through AudioEngine; setVolume not exposed yet
    },
    [],
  );

  const toggleMuteWrapped = useCallback(() => {
    toggleMute();
  }, [toggleMute]);

  const handleToggleShuffle = useCallback(() => {
    if (!canControlPlayback) return;
    sendPlaybackMode({ shuffle: !playbackMode.shuffle });
  }, [canControlPlayback, playbackMode.shuffle, sendPlaybackMode]);

  const handleCycleRepeat = useCallback(() => {
    if (!canControlPlayback) return;
    const nextRepeatMode: RepeatMode =
      playbackMode.repeatMode === "off"
        ? "all"
        : playbackMode.repeatMode === "all"
          ? "one"
          : "off";
    sendPlaybackMode({ repeatMode: nextRepeatMode });
  }, [canControlPlayback, playbackMode.repeatMode, sendPlaybackMode]);

  // ── Media Session ─────────────────────────────────────────────────────────

  const handleSkipBackRef = useRef(handleSkipBack);
  useEffect(() => { handleSkipBackRef.current = handleSkipBack; }, [handleSkipBack]);
  const handleSkipForwardRef = useRef(handleSkipForward);
  useEffect(() => { handleSkipForwardRef.current = handleSkipForward; }, [handleSkipForward]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: playback?.trackName || "Blu3",
        artist: playback?.artistName || "",
        artwork: playback?.image ? [{ src: playback.image, sizes: "512x512", type: "image/png" }] : [],
      });
    } catch {}
  }, [playback?.trackName, playback?.artistName, playback?.image]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler("previoustrack", () =>
        handleSkipBackRef.current(),
      );
      navigator.mediaSession.setActionHandler("nexttrack", () =>
        handleSkipForwardRef.current(),
      );
      navigator.mediaSession.setActionHandler("seekbackward", () => {
        const newTime = Math.max(0, engineCurrentTime - 10);
        audioEngine?.seekTo(newTime);
        if (canControlPlayback) hostSeek(newTime);
      });
      navigator.mediaSession.setActionHandler("seekforward", () => {
        const newTime = Math.min(engineDuration, engineCurrentTime + 10);
        audioEngine?.seekTo(newTime);
        if (canControlPlayback) hostSeek(newTime);
      });
      navigator.mediaSession.setActionHandler("play", () => {
        if (playerState === "playing") return;
        if (!canControlPlayback) return;
        if (playback?.videoId) hostPlay(
          playback.videoId, engineCurrentTime, playback.durationMs,
          playback.source, playback.trackName, playback.artistName, playback.image,
        );
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        if (playerState !== "playing") return;
        if (!canControlPlayback) return;
        hostPause();
      });
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime != null) {
          audioEngine?.seekTo(details.seekTime);
          if (canControlPlayback) hostSeek(details.seekTime);
        }
      });
    } catch {}
  }, [engineCurrentTime, engineDuration, canControlPlayback, playerState, playback, audioEngine, hostSeek, hostPlay, hostPause]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const interval = setInterval(() => {
      const dur = playback?.durationMs ? playback.durationMs / 1000 : 0;
      if (dur <= 0) return;
      try {
        navigator.mediaSession.setPositionState({
          duration: dur,
          playbackRate: 1,
          position: engineCurrentTime,
        });
      } catch {}
    }, 1000);
    return () => clearInterval(interval);
  }, [playback?.videoId, playback?.durationMs, engineCurrentTime]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  const openSearchOverlay = useCallback(() => {
    setChatOpen(false);
    setSearchOpen(true);
  }, []);
  const closeSearchOverlay = useCallback(() => {
    suggestState.hideSuggestions();
    setSearchOpen(false);
  }, [suggestState.hideSuggestions]);
  const openChatOverlay = useCallback(() => {
    setSearchOpen(false);
    setChatOpen(true);
  }, []);
  const closeChatOverlay = useCallback(() => {
    setChatOpen(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearchOverlay();
      }
      if (event.key === "Escape") {
        closeSearchOverlay();
        closeChatOverlay();
      }
      if (event.code === "Space" && event.target === document.body) {
        event.preventDefault();
        onPlayPauseAction?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeChatOverlay, closeSearchOverlay, openSearchOverlay, onPlayPauseAction]);

  const handleLeave = () => {
    leaveRoom();
    router.replace("/browse");
  };
  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendChat(chatInput.trim());
    setChatInput("");
  };

  const handleSearchInputChange = useCallback(
    (value: string) => {
      searchState.onSearchInput(value);
      suggestState.onSuggestInput(value);
    },
    [searchState.onSearchInput, suggestState.onSuggestInput],
  );
  const runSearchOverlay = useCallback(
    (query: string) => {
      openSearchOverlay();
      suggestState.hideSuggestions();
      const trimmed = query.trim();
      if (!trimmed) {
        searchState.setResults([]);
        return;
      }
      searchState.doSearch(trimmed);
    },
    [openSearchOverlay, searchState.doSearch, searchState.setResults, suggestState.hideSuggestions],
  );
  const showQueuePanel = useCallback(() => {
    setSearchOpen(false);
    setChatOpen(false);
  }, []);
  const handleSearchTrackSelect = useCallback(
    (track: Track) => {
      handleAdminPlayTrack(track);
      closeSearchOverlay();
    },
    [closeSearchOverlay, handleAdminPlayTrack],
  );
  const handleResolveLink = useCallback(
    (url: string) => resolveLink(url, token),
    [token],
  );

  const popularGenres = [
    "Pop hits", "Hip hop", "Lo-fi", "Rock classics", "Bollywood", "EDM",
  ];

  return (
    <>
      <div className="relative min-h-dvh safe-area-top safe-area-bottom">
        <div
          className={`absolute inset-0 z-50 transition-opacity duration-500 ${
            authLoading || !joined || !initialDataLoaded
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <RoomLoading />
        </div>
        <div
          className={`transition-opacity duration-500 ${
            authLoading || !joined || !initialDataLoaded
              ? "opacity-0 pointer-events-none"
              : "opacity-100 pointer-events-auto"
          }`}
        >
          <div className="w-full h-full bg-black relative">
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
              <RoomBackground
                isPlaying={playerState === "playing"}
                trackImage={footerTrack?.image}
              />
            </div>

            <div className="relative z-10 gap-2 sm:h-dvh items-center justify-center flex flex-col h-full w-full overflow-hidden">
              <div
                className="mx-auto flex sm:border border-white/10 h-full sm:h-[82%] flex-col pb-0  px-0 sm:rounded-3xl
              w-[55%] max-2xl:w-[62%] max-xl:w-[clamp(1rem,120vh,500rem)] max-lg:w-[92%] max-sm:w-full
              filter shadow-[0_0_40px_rgba(0,0,0,0.6)]
              sm:filter sm:shadow-[0_0_60px_rgba(0,0,0,0.5)] "
              >
                <div className="flex h-full mt-0  gap-0 sm:gap-2 pt-0  min-h-0">
                  <div className="relative w-full h-full flex flex-col sm:flex-row min-h-0 flex-1 gap-0 sm:gap-3 pb-0  lg:pb-0">
                    <aside
                      className="
                  w-full sm:w-[55%] h-full lg:h-full shrink-0 min-h-125 sm:min-h-0 lg:min-h-0
                  max-sm:rounded-none sm:rounded-3xl
                  max-sm:border-0 sm:border sm:border-white/10
                  bg-white/5
                   backdrop-blur-2xl

                  filter drop-shadow-[0_0_40px_rgba(0,0,0,1)]
                  sm:filter sm:drop-shadow-[0_0_60px_rgba(0,0,0,1)]

                  overflow-visible

                  relative transition-all duration-300
                  max-sm:before:hidden sm:before:absolute sm:before:inset-0 sm:before:rounded-3xl sm:before:pointer-events-none sm:before:bg-linear-to-b sm:before:from-white/4 sm:before:to-transparent
                "
                    >
                      <SquarePlayer
                        track={footerTrack}
                        activeVideoId={
                          audioEngine?.activeVideoId ?? playback?.videoId ?? null
                        }
                        playerState={footerPlayerState}
                        isLiked={isLiked}
                        onToggleLike={handleToggleLike}
                        progress={engineProgress || (displayCurrentTime > 0 && playback?.durationMs ? (displayCurrentTime / (playback.durationMs / 1000)) * 100 : 0)}
                        currentTime={displayCurrentTime}
                        duration={engineDuration || (playback?.durationMs ? playback.durationMs / 1000 : 0)}
                        volume={volume}
                        isMuted={isMuted}
                        onPlayPause={onPlayPauseAction}
                        onMute={toggleMuteWrapped}
                        onVolume={handleVolumeWrapped}
                        onSeek={
                          canControlPlayback ? handleSeekAction : undefined
                        }
                        onSkipBack={
                          canControlPlayback ? handleSkipBack : undefined
                        }
                        onSkipForward={
                          canControlPlayback ? handleSkipForward : undefined
                        }
                      />
                    </aside>

                    <aside
                      className="
                  flex-1 min-w-0 w-full sm:w-[45%] h-full lg:h-full shrink-0 min-h-95 sm:min-h-0 lg:min-h-0
                  max-sm:rounded-none sm:rounded-3xl
                  max-sm:border-0 sm:border-2 sm:border-white/8
                  bg-white/5
                  backdrop-blur-2xl

                  filter drop-shadow-[0_0_40px_rgba(0,0,0,1)]
                  sm:filter sm:drop-shadow-[0_0_60px_rgba(0,0,0,0.6)]

                  overflow-visible

                  transition-all duration-300
                  max-sm:before:hidden sm:before:absolute sm:before:inset-0 sm:before:rounded-3xl sm:before:pointer-events-none sm:before:bg-gradient-to-b sm:before:from-white/[0.04] sm:before:to-transparent
                  flex flex-col
                "
                    >
                      <RightSidebar
                        members={members}
                        messages={chatMessages}
                        queue={queue}
                        recentTracks={recentTracks}
                        canControlPlayback={canControlPlayback}
                        handleAdminPlayTrack={handleAdminPlayTrack}
                        removeFromQueue={removeFromQueue}
                        addToQueue={addToQueue}
                        activeVideoId={
                          audioEngine?.activeVideoId ?? playback?.videoId ?? null
                        }
                        roomTheme={roomTheme}
                        onThemeChange={setRoomTheme}
                        playerState={footerPlayerState}
                        shuffleEnabled={playbackMode.shuffle}
                        repeatMode={playbackMode.repeatMode}
                        onToggleShuffle={
                          canControlPlayback ? handleToggleShuffle : undefined
                        }
                        onCycleRepeat={
                          canControlPlayback ? handleCycleRepeat : undefined
                        }
                        onChatToggle={() => setChatOpen(!chatOpen)}
                        chatOpen={chatOpen}
                        chatInput={chatInput}
                        setChatInput={setChatInput}
                        handleSendChat={handleSendChat}
                        nextTrack={nextTrack}
                        onSearchClick={openSearchOverlay}
                        clearQueue={clearQueue}
                        user={user}
                        onLogout={() => {
                          logout();
                          router.push("/");
                        }}
                        onLeave={handleLeave}
                        roomCode={code}
                        resolveLink={handleResolveLink}
                      />
                    </aside>
                  </div>
                </div>
              </div>
            </div>

            {queueToast && <QueueToast data={queueToast} />}
            {joinErrorMessage && <RoomErrorModal message={joinErrorMessage} />}

            <SearchOverlay
              isOpen={searchOpen}
              onClose={closeSearchOverlay}
              searchQuery={searchState.searchQuery}
              suggestions={suggestState.suggestions}
              showSuggestions={suggestState.showSuggestions}
              results={searchState.results}
              isSearching={searchState.isSearching}
              searchError={searchState.searchError ?? ""}
              recentTracks={
                recentTracks.map(asTrackFromRecent).filter(Boolean) as Track[]
              }
              activeTrackId={playback?.videoId ?? null}
              loadingTrackId={null}
              isPlaying={playerState === "playing"}
              onSearchInput={(val) => {
                searchState.onSearchInput(val);
                suggestState.onSuggestInput(val);
              }}
              onSearch={(q) => {
                suggestState.hideSuggestions();
                if (q.trim()) searchState.doSearch(q.trim());
                else searchState.setResults([]);
              }}
              onSuggestionSelect={(s) => {
                suggestState.hideSuggestions();
                searchState.onSearchInput(s);
                searchState.doSearch(s);
              }}
              onTrackSelect={handleSearchTrackSelect}
              onAddToQueue={(track) => {
                addToQueue(track);
              }}
              avatarUrl={user?.avatar ?? undefined}
              avatarLabel={user?.name || user?.email || "U"}
              popularGenres={popularGenres}
            />
          </div>
        </div>
      </div>
    </>
  );
}
