"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
import { RoomTopBar } from "@/components/Player/ui/Roomtopbar";
import { Track } from "@/utils/types";
import { CDPlayer } from "@/components/Player/ui/Cdplayer";
import {
  asTrackFromPlayback,
  asTrackFromRecent,
  RoomTheme,
} from "@/utils/roomHelpers";
import { RightSidebar } from "@/components/Player/ui/RightSidebar";
import { RoomLoading } from "@/components/Player/ui/RoomLoading";
import { QueueAndHistory } from "@/components/Player/ui/QueueAndHistory";
import { NowPlayingBar } from "@/components/Player/ui/NowPlayingBar";
import { Search } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
type RepeatMode = "off" | "all" | "one";

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [roomTheme, setRoomTheme] = useState<RoomTheme>("purple");

  const scheduledPlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const scheduledPauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const scheduledSeekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const {
    connected,
    isHost: socketIsHost,
    members,
    playback,
    playbackMode,
    messages,
    recentTracks,
    queue,
    setQueue,
    sendChat,
    sendPlay,
    sendPause,
    sendSeek,
    requestSync,
    sendPlaybackMode,
    sendPlaybackState,
    getSyncedTime,
    addToQueue,
    removeFromQueue,
    cycleQueueCurrent,
  } = useRoomSocket({
    roomCode: joined ? code : null,
    onSchedulePlay: (state, syncedTime) => scheduleRoomPlay(state, syncedTime),
    onSchedulePause: (state, syncedTime) =>
      scheduleRoomPause(state, syncedTime),
    onScheduleSeek: (state, syncedTime) => scheduleRoomSeek(state, syncedTime),
    onPlaybackSync: (state, syncedTime) => {
      if (!state.videoId) return;
      if (state.isPlaying && state.updatedAt > syncedTime() + 150) {
        scheduleRoomPlay(
          {
            videoId: state.videoId,
            seekTo: state.currentTime ?? 0,
            targetTime: state.updatedAt,
            id: `room-${state.videoId}`,
            trackName: state.trackName,
            artistName: state.artistName,
            image: state.image,
            duration_ms: 0,
          },
          syncedTime,
        );
        return;
      }
      let actualCurrentTime = state.currentTime ?? 0;
      if (state.isPlaying && state.updatedAt) {
        const elapsed = (syncedTime() - state.updatedAt) / 1000;
        if (elapsed > 0 && elapsed < 3600) actualCurrentTime += elapsed;
      }
      if (playerState.nowPlaying?.videoId === state.videoId) {
        if (state.isPlaying) playerState.play?.();
        else playerState.pause?.();
        progressState.seekTo(actualCurrentTime);
        setTimeout(() => {
          if (state.isPlaying) playerState.play?.();
          else playerState.pause?.();
          progressState.seekTo(actualCurrentTime);
        }, 150);
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
          state.isPlaying,
        );
      }
    },
  });

  const isHost = room?.hostId === user?.sub || socketIsHost;
  const isHostPresent = room?.hostId
    ? members.some((m) => m.userId === room.hostId)
    : false;
  const canControlPlayback = isHost || !isHostPresent;
  const queueAdvanceLockRef = useRef<string | null>(null);

  const playbackTrack = asTrackFromPlayback(playback);
  const lastPlayedTrack = asTrackFromRecent(recentTracks[0]);
  const footerTrack =
    playerState.nowPlaying ?? playbackTrack ?? lastPlayedTrack;
  const footerPlayerState =
    playerState.playerState === "idle" && playback?.videoId
      ? playback.isPlaying
        ? "loading"
        : "paused"
      : playerState.playerState;
  const carouselTracks = (queue.length > 0
    ? queue
    : footerTrack
      ? [footerTrack]
      : []
  ).slice(0, 8);

  /* ─── Scheduling helpers ─────────────────────── */
  const clearScheduledTimeout = useCallback(
    (ref: React.MutableRefObject<ReturnType<typeof setTimeout> | null>) => {
      if (ref.current) {
        clearTimeout(ref.current);
        ref.current = null;
      }
    },
    [],
  );
  const clearScheduledPlaybackActions = useCallback(() => {
    clearScheduledTimeout(scheduledPlayTimeoutRef);
    clearScheduledTimeout(scheduledPauseTimeoutRef);
    clearScheduledTimeout(scheduledSeekTimeoutRef);
  }, [clearScheduledTimeout]);
  const scheduleSyncedAction = useCallback(
    (
      ref: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
      targetTime: number,
      syncedTime: () => number,
      action: () => void,
    ) => {
      clearScheduledTimeout(ref);
      const delay = Math.max(targetTime - syncedTime(), 0);
      ref.current = setTimeout(() => {
        ref.current = null;
        action();
      }, delay);
    },
    [clearScheduledTimeout],
  );

  const scheduleRoomPlay = useCallback(
    (
      state: {
        videoId: string;
        seekTo: number;
        targetTime: number;
        id?: string;
        trackName?: string;
        artistName?: string;
        image?: string;
        duration_ms?: number;
      },
      syncedTime: () => number,
    ) => {
      clearScheduledPlaybackActions();
      const track: Track = {
        id: state.id ?? `room-${state.videoId}`,
        videoId: state.videoId,
        name: state.trackName ?? "Playing from room",
        duration_ms: state.duration_ms ?? 0,
        explicit: false,
        artists: [{ name: state.artistName ?? "" }],
        album: { name: "" },
        image: state.image ?? "",
      };
      const initialLateBySec =
        Math.max(syncedTime() - state.targetTime, 0) / 1000;
      const initialSeekTo = state.seekTo + initialLateBySec;
      if (playerState.nowPlaying?.videoId === state.videoId) {
        playerState.pause?.();
        progressState.seekTo(initialSeekTo);
      } else {
        playerState.playTrack(track, initialSeekTo, false);
      }
      scheduleSyncedAction(
        scheduledPlayTimeoutRef,
        state.targetTime,
        syncedTime,
        () => {
          const liveLateBySec =
            Math.max(syncedTime() - state.targetTime, 0) / 1000;
          const liveSeekTo = state.seekTo + liveLateBySec;
          progressState.seekTo(liveSeekTo);
          playerState.play?.();
          setTimeout(() => {
            progressState.seekTo(liveSeekTo);
            playerState.play?.();
          }, 150);
        },
      );
    },
    [
      clearScheduledPlaybackActions,
      playerState.nowPlaying?.videoId,
      playerState.pause,
      playerState.play,
      playerState.playTrack,
      progressState,
      scheduleSyncedAction,
    ],
  );
  const scheduleRoomPause = useCallback(
    (state: { targetTime: number }, syncedTime: () => number) => {
      clearScheduledTimeout(scheduledPauseTimeoutRef);
      scheduleSyncedAction(
        scheduledPauseTimeoutRef,
        state.targetTime,
        syncedTime,
        () => {
          playerState.pause?.();
        },
      );
    },
    [clearScheduledTimeout, playerState.pause, scheduleSyncedAction],
  );
  const scheduleRoomSeek = useCallback(
    (
      state: { seekTo: number; targetTime: number },
      syncedTime: () => number,
    ) => {
      clearScheduledTimeout(scheduledSeekTimeoutRef);
      scheduleSyncedAction(
        scheduledSeekTimeoutRef,
        state.targetTime,
        syncedTime,
        () => {
          progressState.seekTo(state.seekTo);
        },
      );
    },
    [clearScheduledTimeout, progressState, scheduleSyncedAction],
  );

  /* ─── Playback sync on join ────────────────────────── */
  useEffect(() => {
    if (
      !joined ||
      !playback?.videoId ||
      playerState.nowPlaying?.videoId === playback.videoId
    )
      return;
    if (playback.isPlaying && playback.updatedAt > getSyncedTime() + 150) {
      scheduleRoomPlay(
        {
          videoId: playback.videoId,
          seekTo: playback.currentTime ?? 0,
          targetTime: playback.updatedAt,
          id: `room-${playback.videoId}`,
          trackName: playback.trackName,
          artistName: playback.artistName,
          image: playback.image,
          duration_ms: 0,
        },
        getSyncedTime,
      );
      return;
    }
    let actualCurrentTime = playback.currentTime ?? 0;
    if (playback.isPlaying && playback.updatedAt) {
      const elapsed = (getSyncedTime() - playback.updatedAt) / 1000;
      if (elapsed > 0 && elapsed < 3600) actualCurrentTime += elapsed;
    }
    playerState.playTrack(
      {
        id: `room-${playback.videoId}`,
        videoId: playback.videoId,
        name: playback.trackName,
        duration_ms: 0,
        explicit: false,
        artists: [{ name: playback.artistName }],
        album: { name: "" },
        image: playback.image,
      },
      actualCurrentTime,
      playback.isPlaying,
    );
  }, [
    getSyncedTime,
    joined,
    playback,
    playerState.nowPlaying?.videoId,
    playerState.playTrack,
    scheduleRoomPlay,
  ]);

  /* ─── Queue advance ────────────────────────────────── */
  const maybeAdvanceQueue = useCallback(() => {
    if (!canControlPlayback || !joined) return;
    const activeTrack = playerState.nowPlaying;
    const currentQueueTrack = queue[0];
    if (!activeTrack || !currentQueueTrack) return;
    const isCurrentQueueTrack =
      currentQueueTrack.videoId === activeTrack.videoId ||
      currentQueueTrack.id === activeTrack.id;
    if (!isCurrentQueueTrack) return;
    const activeKey = activeTrack.videoId || activeTrack.id;
    if (!activeKey || queueAdvanceLockRef.current === activeKey) return;
    queueAdvanceLockRef.current = activeKey;
    if (playbackMode.repeatMode === "one") {
      sendPlay({
        id: activeTrack.id,
        videoId: activeTrack.videoId,
        trackName: activeTrack.name,
        artistName: activeTrack.artists?.[0]?.name ?? "",
        image: activeTrack.image ?? "",
        currentTime: 0,
        duration_ms: activeTrack.duration_ms,
      });
      return;
    }
    const upcomingTracks = queue.slice(1);
    const nextTrack =
      upcomingTracks.length > 0
        ? playbackMode.shuffle
          ? upcomingTracks[Math.floor(Math.random() * upcomingTracks.length)]
          : upcomingTracks[0]
        : playbackMode.repeatMode === "all"
          ? currentQueueTrack
          : null;
    if (
      playbackMode.repeatMode === "all" &&
      nextTrack &&
      nextTrack.id !== currentQueueTrack.id
    )
      cycleQueueCurrent(currentQueueTrack.id);
    if (nextTrack)
      sendPlay({
        id: nextTrack.id,
        videoId: nextTrack.videoId,
        trackName: nextTrack.name,
        artistName: nextTrack.artists?.[0]?.name ?? "",
        image: nextTrack.image ?? "",
        currentTime: 0,
        duration_ms: nextTrack.duration_ms,
      });
    if (playbackMode.repeatMode !== "all")
      removeFromQueue(currentQueueTrack.id);
  }, [
    cycleQueueCurrent,
    canControlPlayback,
    joined,
    playbackMode.repeatMode,
    playbackMode.shuffle,
    playerState.nowPlaying,
    queue,
    sendPlay,
    removeFromQueue,
  ]);

  useEffect(() => {
    if (playerState.playerState === "ended") maybeAdvanceQueue();
  }, [maybeAdvanceQueue, playerState.playerState]);
  useEffect(() => {
    const activeKey =
      playerState.nowPlaying?.videoId || playerState.nowPlaying?.id || null;
    if (!activeKey) {
      queueAdvanceLockRef.current = null;
      return;
    }
    if (
      queueAdvanceLockRef.current === activeKey &&
      ["loading", "playing"].includes(playerState.playerState) &&
      progressState.currentTime < 2
    ) {
      queueAdvanceLockRef.current = null;
      return;
    }
    if (
      queueAdvanceLockRef.current &&
      queueAdvanceLockRef.current !== activeKey
    )
      queueAdvanceLockRef.current = null;
  }, [
    playerState.nowPlaying?.id,
    playerState.nowPlaying?.videoId,
    playerState.playerState,
    progressState.currentTime,
  ]);

  useEffect(() => {
    if (
      !canControlPlayback ||
      !joined ||
      playerState.playerState !== "playing" ||
      !playerState.nowPlaying?.duration_ms
    )
      return;
    const activeTrack = playerState.nowPlaying;
    const currentQueueTrack = queue[0];
    if (
      !currentQueueTrack ||
      (currentQueueTrack.videoId !== activeTrack.videoId &&
        currentQueueTrack.id !== activeTrack.id)
    )
      return;
    const remainingMs = Math.max(
      activeTrack.duration_ms - progressState.currentTime * 1000,
      0,
    );
    const timeoutId = window.setTimeout(() => {
      const player = playerState.playerRef.current;
      const currentTime =
        player?.getCurrentTime?.() ?? progressState.currentTime;
      const duration =
        player?.getDuration?.() ?? activeTrack.duration_ms / 1000;
      const isNearEnd =
        duration > 0 && currentTime >= Math.max(duration - 2, 0);
      if (playerState.playerState === "ended" || isNearEnd) maybeAdvanceQueue();
    }, remainingMs + 2500);
    return () => window.clearTimeout(timeoutId);
  }, [
    canControlPlayback,
    joined,
    maybeAdvanceQueue,
    playerState.nowPlaying,
    playerState.playerRef,
    playerState.playerState,
    progressState.currentTime,
    queue,
  ]);

  /* ─── Admin play ────────────────────────────────────── */
  const handleAdminPlayTrack = useCallback(
    (track: Track) => {
      if (!canControlPlayback) return;
      setQueue((prev) => {
        const filtered = prev.filter(
          (t) => t.id !== track.id && t.videoId !== track.videoId,
        );
        return [track, ...filtered];
      });
      sendPlay({
        id: track.id,
        videoId: track.videoId,
        trackName: track.name,
        artistName: track.artists?.[0]?.name ?? "",
        image: track.image ?? "",
        currentTime: 0,
        duration_ms: track.duration_ms,
      });
    },
    [canControlPlayback, sendPlay, setQueue],
  );

  /* ─── Silent audio context ─────────────────────────── */
  const audioContextRef = useRef<AudioContext | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const startSilentAudio = () => {
      if (audioContextRef.current) return;
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      try {
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;
        const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < channelData.length; i++)
          channelData[i] = (Math.random() - 0.5) * 0.00001;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.0001;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
        if (ctx.state === "suspended") ctx.resume();
      } catch (err) {
        console.error("Failed to start background tab keeper:", err);
      }
    };
    const events = ["click", "keydown", "touchstart", "mousedown"];
    events.forEach((evt) =>
      window.addEventListener(evt, startSilentAudio, { once: true }),
    );
    return () => {
      events.forEach((evt) =>
        window.removeEventListener(evt, startSilentAudio),
      );
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  /* ─── Seek / play-pause / shuffle / repeat ──────────────── */
  const handleSeekAction = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canControlPlayback || !progressState.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const seekToTime =
      ((e.clientX - rect.left) / rect.width) * progressState.duration;
    sendSeek(seekToTime);
  };
  const handlePlayPauseAction = useCallback(() => {
    if (!canControlPlayback || !playerState.nowPlaying?.videoId) return;
    if (playerState.playerState === "playing") {
      sendPause(progressState.currentTime);
      return;
    }
    sendPlay({
      id: playerState.nowPlaying.id,
      videoId: playerState.nowPlaying.videoId,
      trackName: playerState.nowPlaying.name,
      artistName: playerState.nowPlaying.artists?.[0]?.name ?? "",
      image: playerState.nowPlaying.image ?? "",
      currentTime: progressState.currentTime,
      duration_ms: playerState.nowPlaying.duration_ms,
    });
  }, [
    canControlPlayback,
    playerState.nowPlaying,
    playerState.playerState,
    progressState.currentTime,
    sendPause,
    sendPlay,
  ]);
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

  /* ─── Lifecycle effects ────────────────────────────── */
  useEffect(() => {
    return () => {
      clearScheduledPlaybackActions();
    };
  }, [clearScheduledPlaybackActions]);
  useEffect(() => {
    if (authLoading || !user || !code) return;
    if (room?.code === code) {
      setJoined(true);
      return;
    }
    joinRoom(code).then((r) => {
      if (r) setJoined(true);
      else router.replace("/browse");
    });
  }, [authLoading, user, code]);
  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [authLoading, user]);
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        joined &&
        !canControlPlayback
      )
        requestSync();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [canControlPlayback, joined, requestSync]);
  useEffect(() => {
    if (!joined || !canControlPlayback || !playerState.nowPlaying?.videoId)
      return;
    const playbackState =
      playerState.playerState === "playing"
        ? "playing"
        : playerState.playerState === "paused"
          ? "paused"
          : playerState.playerState === "loading"
            ? "buffering"
            : null;
    if (!playbackState) return;
    const liveCurrentTime =
      playerState.playerRef.current?.getCurrentTime?.() ??
      progressState.currentTime;
    sendPlaybackState(playbackState, liveCurrentTime);
  }, [
    canControlPlayback,
    joined,
    playerState.nowPlaying?.videoId,
    playerState.playerRef,
    playerState.playerState,
    sendPlaybackState,
  ]);
  useEffect(() => {
    if (!joined || !canControlPlayback || playerState.playerState !== "playing")
      return;
    const heartbeatId = window.setInterval(() => {
      const liveCurrentTime =
        playerState.playerRef.current?.getCurrentTime?.() ??
        progressState.currentTime;
      sendPlaybackState("playing", liveCurrentTime);
    }, 2000);
    return () => window.clearInterval(heartbeatId);
  }, [
    canControlPlayback,
    joined,
    playerState.playerRef,
    playerState.playerState,
    sendPlaybackState,
  ]);
  const openSearchOverlay = useCallback(() => {
    setChatOpen(false);
    setSearchOpen(true);
  }, []);
  const closeSearchOverlay = useCallback(() => {
    suggestState.hideSuggestions();
    setSearchOpen(false);
  }, [suggestState]);
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
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeChatOverlay, closeSearchOverlay, openSearchOverlay]);

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
    return <RoomLoading />;
  }

  return (
    <div>
      <YouTubeIframe />
      <div className="h-screen overflow-hidden bg-[url('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600')] bg-cover bg-center bg-fixed">
        <div className="h-screen overflow-hidden bg-slate-950/55">
          <div className="mx-auto flex h-screen max-w-7xl flex-col px-4 pb-28 pt-4 md:px-6 lg:px-8">
            <RoomTopBar
              roomName={room?.name ?? "Room"}
              roomCode={code}
              isHost={isHost}
              connected={connected}
              track={footerTrack}
              roomTheme={roomTheme}
              activeVideoId={playerState.activeVideoId ?? playback?.videoId ?? null}
              playerState={footerPlayerState}
              onCopyInvite={() => navigator.clipboard.writeText(window.location.href)}
              onLeave={handleLeave}
            />

            <div className="flex min-h-0 flex-1 flex-col gap-4 pt-4">
              <div className="mx-auto flex w-full max-w-4xl items-center gap-3 rounded-[24px] border border-white/20 bg-white/10 px-4 py-3 text-white backdrop-blur-xl">
                <Search size={16} className="shrink-0 text-white/70" />
                <input
                  value={searchState.searchQuery}
                  onChange={(e) => searchState.onSearchInput(e.target.value)}
                    onFocus={() =>
                      suggestState.suggestions.length > 0 &&
                      suggestState.setShowSuggestions(true)
                    }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      searchState.doSearch(searchState.searchQuery);
                    }
                  }}
                  placeholder="Search by title, artist or album..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/45"
                />
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 text-xs font-semibold">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (user?.name || user?.email || "U").slice(0, 1).toUpperCase()
                  )}
                </div>
              </div>

              <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
                {(carouselTracks.length > 0
                  ? carouselTracks
                  : Array.from({ length: 8 }, (_, index) => index)
                ).map((item, index) => {
                  const image =
                    typeof item === "number"
                      ? `https://picsum.photos/seed/${index}/144/144`
                      : item.image ||
                      `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;
                  const key =
                    typeof item === "number"
                      ? `placeholder-${item}`
                      : `${item.id}-${index}`;

                  return (
                    <div
                      key={key}
                      className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-white/10"
                    >
                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  );
                })}
              </div>

              {!canControlPlayback ? (
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-white/70 backdrop-blur-xl">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Synced to host
                </div>
              ) : !isHost ? (
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-white/70 backdrop-blur-xl">
                  <span className="h-2 w-2 rounded-full bg-sky-300" />
                  Collaborative control enabled
                </div>
              ) : null}

              <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
                <aside className="min-h-0 rounded-[28px] border border-white/20 bg-white/10 p-4 text-white backdrop-blur-xl">
                  <QueueAndHistory
                    queue={queue}
                    recentTracks={recentTracks}
                    canControlPlayback={canControlPlayback}
                    handleAdminPlayTrack={handleAdminPlayTrack}
                    removeFromQueue={removeFromQueue}
                    addToQueue={addToQueue}
                    activeVideoId={playerState.nowPlaying?.videoId}
                  />
                </aside>

                <div className="grid min-h-0 gap-4 xl:grid-rows-[auto_minmax(0,1fr)]">
                  <CDPlayer
                    track={footerTrack}
                    playerState={footerPlayerState}
                    progress={progressState.progress}
                    currentTime={progressState.currentTime}
                    duration={progressState.duration}
                    shuffleEnabled={playbackMode.shuffle}
                    repeatMode={playbackMode.repeatMode}
                    onPlayPause={canControlPlayback ? handlePlayPauseAction : undefined}
                    onToggleShuffle={canControlPlayback ? handleToggleShuffle : undefined}
                    onCycleRepeat={canControlPlayback ? handleCycleRepeat : undefined}
                    onSeek={canControlPlayback ? handleSeekAction : undefined}
                    roomLabel={room?.name ?? "Blu3"}
                  />

                  <div className="rounded-[28px] border border-white/20 bg-white/10 p-4 text-white backdrop-blur-xl">
                    <div className="grid gap-2 md:grid-cols-4">
                      {members.slice(0, 4).map((member) => (
                        <div
                          key={member.userId}
                          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
                        >
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm text-white/75">
                              {member.name[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm text-white">
                              {member.name}
                            </p>
                            <p className="text-xs text-white/55">In room</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
              </div>

                <RightSidebar
                  members={members}
                  messages={messages}
                  roomTheme={roomTheme}
                  onThemeChange={setRoomTheme}
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  handleSendChat={handleSendChat}
                  queue={queue}
                  recentTracks={recentTracks}
                  canControlPlayback={canControlPlayback}
                  handleAdminPlayTrack={handleAdminPlayTrack}
                  removeFromQueue={removeFromQueue}
                  addToQueue={addToQueue}
                  activeVideoId={playerState.nowPlaying?.videoId}
                  searchOpen={searchOpen}
                  chatOpen={chatOpen}
                  onOpenSearch={openSearchOverlay}
                  onCloseSearch={closeSearchOverlay}
                  onOpenChat={openChatOverlay}
                  onCloseChat={closeChatOverlay}
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
                  onTrackSelect={canControlPlayback ? handleAdminPlayTrack : undefined}
                  onSearchFocus={() =>
                    suggestState.suggestions.length > 0 &&
                    suggestState.setShowSuggestions(true)
                  }
                  onSearchBlur={() =>
                    setTimeout(() => suggestState.hideSuggestions(), 200)
                  }
                  onSearchKeyDown={(e) => {
                    if (e.key === "Enter") {
                      searchState.doSearch(searchState.searchQuery);
                      suggestState.hideSuggestions();
                    }
                    if (e.key === "Escape") {
                      suggestState.hideSuggestions();
                    }
                  }}
                  userAvatar={user?.avatar}
                  userLabel={user?.name ?? user?.email ?? "U"}
                />
            </div>
          </div>
        </div>
        </div>
      </div>

      <NowPlayingBar
        track={footerTrack}
        activeVideoId={playerState.activeVideoId ?? playback?.videoId ?? null}
        playerState={footerPlayerState}
        progress={progressState.progress}
        currentTime={progressState.currentTime}
        duration={progressState.duration}
        volume={playerState.volume}
        isMuted={playerState.isMuted}
        shuffleEnabled={playbackMode.shuffle}
        repeatMode={playbackMode.repeatMode}
        onPlayPause={canControlPlayback ? handlePlayPauseAction : undefined}
        onToggleShuffle={canControlPlayback ? handleToggleShuffle : undefined}
        onCycleRepeat={canControlPlayback ? handleCycleRepeat : undefined}
        onMute={playerState.toggleMute}
        onVolume={playerState.handleVolume}
        onSeek={canControlPlayback ? handleSeekAction : undefined}
      />

      <style>{`
        .room-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .room-scroll::-webkit-scrollbar-track { background: transparent; }
        .room-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.18); border-radius: 999px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );  
}
