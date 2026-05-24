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
import { NowPlayingBar } from "@/components/Player/ui/NowPlayingBar";
import { Track } from "@/utils/types";
import { SearchTab } from "@/components/Player/ui/SearchTab";
import { CDPlayer } from "@/components/Player/ui/Cdplayer";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
type RepeatMode = "off" | "all" | "one";

function asTrackFromPlayback(
  playback: {
    videoId: string | null;
    trackName: string;
    artistName: string;
    image: string;
    currentTime?: number;
  } | null,
): Track | null {
  if (!playback?.videoId) return null;
  return {
    id: `room-${playback.videoId}`,
    videoId: playback.videoId,
    name: playback.trackName,
    duration_ms: 0,
    explicit: false,
    artists: [{ name: playback.artistName }],
    album: { name: "" },
    image: playback.image,
  };
}

function asTrackFromRecent(recentTrack?: {
  videoId: string;
  trackName: string;
  artistName: string;
  image: string;
}): Track | null {
  if (!recentTrack) return null;
  return {
    id: recentTrack.videoId,
    videoId: recentTrack.videoId,
    name: recentTrack.trackName,
    duration_ms: 0,
    explicit: false,
    artists: [{ name: recentTrack.artistName }],
    album: { name: "" },
    image: recentTrack.image,
  };
}

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
  const scheduledPlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const scheduledPauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const scheduledSeekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const [leftTab, setLeftTab] = useState<"search" | "queue">("search");
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
    onSchedulePlay: (state, syncedTime) => {
      scheduleRoomPlay(state, syncedTime);
    },
    onSchedulePause: (state, syncedTime) => {
      scheduleRoomPause(state, syncedTime);
    },
    onScheduleSeek: (state, syncedTime) => {
      scheduleRoomSeek(state, syncedTime);
    },
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
        setTimeout(() => {
          if (state.isPlaying) {
            playerState.play?.();
          } else {
            playerState.pause?.();
          }
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

  useEffect(() => {
    if (
      !joined ||
      !playback?.videoId ||
      playerState.nowPlaying?.videoId === playback.videoId
    ) {
      return;
    }

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
      if (elapsed > 0 && elapsed < 3600) {
        actualCurrentTime += elapsed;
      }
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
    ) {
      cycleQueueCurrent(currentQueueTrack.id);
    }

    if (nextTrack) {
      sendPlay({
        id: nextTrack.id,
        videoId: nextTrack.videoId,
        trackName: nextTrack.name,
        artistName: nextTrack.artists?.[0]?.name ?? "",
        image: nextTrack.image ?? "",
        currentTime: 0,
        duration_ms: nextTrack.duration_ms,
      });
    }

    if (playbackMode.repeatMode !== "all") {
      removeFromQueue(currentQueueTrack.id);
    }
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

  // Controller: Automatically play next song in queue when current song ends
  useEffect(() => {
    if (playerState.playerState === "ended") {
      maybeAdvanceQueue();
    }
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
    ) {
      queueAdvanceLockRef.current = null;
    }
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
    ) {
      return;
    }

    const activeTrack = playerState.nowPlaying;
    const currentQueueTrack = queue[0];
    if (
      !currentQueueTrack ||
      (currentQueueTrack.videoId !== activeTrack.videoId &&
        currentQueueTrack.id !== activeTrack.id)
    ) {
      return;
    }

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

      if (playerState.playerState === "ended" || isNearEnd) {
        maybeAdvanceQueue();
      }
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

  // Optimistic 0ms local queue/playback synchronization for host
  const handleAdminPlayTrack = useCallback(
    (track: Track) => {
      if (!canControlPlayback) return;

      // Add to the top of the queue locally immediately for 0ms visual difference
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

  // Web Audio Context keeper to prevent browser tab throttling/suspension in background
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

        // Generate dynamic extremely low noise (effectively silent to humans)
        // to bypass the browser's silence detector
        const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < channelData.length; i++) {
          channelData[i] = (Math.random() - 0.5) * 0.00001;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.0001; // completely inaudible

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.start(0);

        if (ctx.state === "suspended") {
          ctx.resume();
        }
      } catch (err) {
        console.error("Failed to start background tab keeper:", err);
      }
    };

    const events = ["click", "keydown", "touchstart", "mousedown"];
    events.forEach((evt) => {
      window.addEventListener(evt, startSilentAudio, { once: true });
    });

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, startSilentAudio);
      });
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleSeekAction = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canControlPlayback || !progressState.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const seekToTime =
      ((e.clientX - rect.left) / rect.width) * progressState.duration;
    sendSeek(seekToTime);
  };

  useEffect(() => {
    return () => {
      clearScheduledPlaybackActions();
    };
  }, [clearScheduledPlaybackActions]);

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

  // Re-sync playback when tab becomes visible again to fix background throttling drift
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        joined &&
        !canControlPlayback
      ) {
        requestSync();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
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
    if (
      !joined ||
      !canControlPlayback ||
      playerState.playerState !== "playing"
    ) {
      return;
    }

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

        <div className="flex h-[calc(100vh-8.5rem)] min-h-[32rem] overflow-hidden pt-0">
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

            {/* Tab Switcher Header */}
            <div className="flex border-b border-zinc-900/60 bg-zinc-950/20 px-6 py-3 gap-6 flex-shrink-0">
              <button
                onClick={() => setLeftTab("search")}
                className={`pb-1.5 text-xs tracking-widest uppercase font-bold transition-all relative ${
                  leftTab === "search"
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                ⌕ Search & Discover
                {leftTab === "search" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setLeftTab("queue")}
                className={`pb-1.5 text-xs tracking-widest uppercase font-bold transition-all relative flex items-center gap-1.5 ${
                  leftTab === "queue"
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                ≡ Queue & History
                <span className="bg-zinc-900 text-[10px] px-1.5 py-0.5 rounded-full text-zinc-400 font-mono">
                  {queue.length + recentTracks.length}
                </span>
                {leftTab === "queue" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-500 rounded-full" />
                )}
              </button>
            </div>

            {/* Content pane */}
            <div className="flex-1 overflow-y-auto px-6 py-4 max-w-2xl w-full mx-auto">
              <CDPlayer
                track={footerTrack}
                playerState={footerPlayerState}
                progress={progressState.progress}
                currentTime={progressState.currentTime}
                duration={progressState.duration}
                shuffleEnabled={playbackMode.shuffle}
                repeatMode={playbackMode.repeatMode}
                onPlayPause={
                  canControlPlayback ? handlePlayPauseAction : undefined
                }
                onToggleShuffle={
                  canControlPlayback ? handleToggleShuffle : undefined
                }
                onCycleRepeat={
                  canControlPlayback ? handleCycleRepeat : undefined
                }
                onSeek={canControlPlayback ? handleSeekAction : undefined}
              />
              {leftTab === "search" && (
                <>
                  {!canControlPlayback ? (
                    <div className="mb-4 px-3 py-2 bg-zinc-900 border border-zinc-800/80 rounded-lg text-xs text-zinc-500 tracking-wide flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span>🎵 synced to host — music plays automatically</span>
                    </div>
                  ) : !isHost ? (
                    <div className="mb-4 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-400 tracking-wide flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" />
                      <span>
                        ⚡ Collaborative Mode: Room admin is away. You can play,
                        pause and control the music!
                      </span>
                    </div>
                  ) : null}
                  <SearchTab
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
                    onTrackSelect={
                      canControlPlayback ? handleAdminPlayTrack : undefined
                    }
                    onAddToQueue={addToQueue}
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
                </>
              )}

              {leftTab === "queue" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <h3 className="text-xs text-zinc-500 tracking-widest uppercase font-semibold">
                      Room Queue
                    </h3>
                  </div>

                  {queue.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <span className="text-4xl text-zinc-800 select-none block">
                        ⊞
                      </span>
                      <p className="text-zinc-500 text-xs tracking-wider uppercase font-semibold">
                        The queue is empty
                      </p>
                      <p className="text-zinc-600 text-[10px] max-w-xs mx-auto leading-relaxed">
                        Search for songs in the "Search & Discover" tab and
                        click the "＋" button to add them!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {queue.map((track, i) => (
                        <div
                          key={`${track.id}-${i}`}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-950/40 border border-zinc-900/60 hover:border-zinc-800 transition-all group"
                        >
                          <span className="text-zinc-600 text-xs font-mono w-4 text-right">
                            {i + 1}
                          </span>
                          <img
                            src={track.image}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {track.name}
                            </p>
                            <p className="text-zinc-500 text-[10px] truncate mt-0.5">
                              {track.artists?.[0]?.name ?? "Unknown Artist"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {canControlPlayback && (
                              <button
                                onClick={() => {
                                  handleAdminPlayTrack(track);
                                  removeFromQueue(track.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-[10px] text-green-500 hover:text-green-400 border border-green-950/40 hover:border-green-900 bg-green-500/5 px-2.5 py-1 rounded-lg transition-all tracking-wider uppercase font-bold"
                              >
                                Play Now
                              </button>
                            )}
                            <button
                              onClick={() => removeFromQueue(track.id)}
                              className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/5 transition-colors text-xs"
                              title="Remove from queue"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2 pt-4">
                    <h3 className="text-xs text-zinc-500 tracking-widest uppercase font-semibold">
                      Room History
                    </h3>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-700">
                      {recentTracks.length} played
                    </span>
                  </div>

                  {recentTracks.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <span className="text-4xl text-zinc-800 select-none block">
                        🕘
                      </span>
                      <p className="text-zinc-500 text-xs tracking-wider uppercase font-semibold">
                        No room history yet
                      </p>
                      <p className="text-zinc-600 text-[10px] max-w-xs mx-auto leading-relaxed">
                        Played tracks will appear here for everyone in the room.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {recentTracks.map((track, i) => {
                        const historyTrack: Track = {
                          id: track.videoId,
                          videoId: track.videoId,
                          name: track.trackName,
                          artists: [{ name: track.artistName }],
                          album: { name: "" },
                          image: track.image,
                          duration_ms: 0,
                          explicit: false,
                        };
                        const isTrackActive =
                          playerState.nowPlaying?.videoId === track.videoId;

                        return (
                          <div
                            key={`${track.videoId}-${track.playedAt}-${i}`}
                            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                              isTrackActive
                                ? "border-green-500/20 bg-green-500/10"
                                : "border-zinc-900/60 bg-zinc-950/30 hover:border-zinc-800"
                            }`}
                          >
                            <span className="w-4 text-right font-mono text-xs text-zinc-600">
                              {i + 1}
                            </span>
                            <img
                              src={track.image}
                              alt=""
                              className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                canControlPlayback
                                  ? handleAdminPlayTrack(historyTrack)
                                  : undefined
                              }
                              disabled={!canControlPlayback}
                              className="min-w-0 flex-1 text-left"
                            >
                              <p
                                className={`truncate text-xs font-bold ${
                                  isTrackActive
                                    ? "text-green-400"
                                    : "text-white"
                                }`}
                              >
                                {track.trackName}
                              </p>
                              <p className="mt-0.5 truncate text-[10px] text-zinc-500">
                                {track.artistName}
                              </p>
                            </button>
                            <div className="flex items-center gap-2">
                              {canControlPlayback && (
                                <button
                                  onClick={() =>
                                    handleAdminPlayTrack(historyTrack)
                                  }
                                  className="rounded-lg border border-green-950/40 bg-green-500/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-green-500 transition-all hover:border-green-900 hover:text-green-400"
                                >
                                  Play
                                </button>
                              )}
                              <button
                                onClick={() => addToQueue(historyTrack)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-sm font-bold text-zinc-400 shadow-sm transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white active:scale-95"
                                title="Add to room queue"
                              >
                                ＋
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
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
