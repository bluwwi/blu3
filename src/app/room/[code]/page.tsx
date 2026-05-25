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
import {
  asTrackFromPlayback,
  asTrackFromRecent,
  RoomTheme,
} from "@/utils/roomHelpers";
import { RightSidebar } from "@/components/Player/ui/RightSidebar";
import { RoomLoading } from "@/components/Player/ui/RoomLoading";
import { SearchOverlay } from "@/components/Player/ui/SearchOverlay";
import { SquarePlayer } from "@/components/Player/ui/SquarePlayer";
import { ChatPanel } from "@/components/Player/ui/ChatPanel";

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
  const videoRef = useRef<HTMLVideoElement>(null);
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
    sendTrackEnded,
    getSyncedTime,
    addToQueue,
    removeFromQueue,
    cycleQueueCurrent,
    clearQueue,
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
  const carouselTracks = (
    queue.length > 0 ? queue : footerTrack ? [footerTrack] : []
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
      if (canControlPlayback) {
        if (playerState.nowPlaying?.videoId === state.videoId) {
          progressState.seekTo(initialSeekTo);
          playerState.play?.();
        } else {
          playerState.playTrack(track, initialSeekTo, true);
        }
        return;
      }
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
        },
      );
    },
    [
      canControlPlayback,
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
      if (canControlPlayback) {
        playerState.pause?.();
        return;
      }
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
    [
      canControlPlayback,
      clearScheduledTimeout,
      playerState.pause,
      scheduleSyncedAction,
    ],
  );
  const scheduleRoomSeek = useCallback(
    (
      state: { seekTo: number; targetTime: number },
      syncedTime: () => number,
    ) => {
      if (canControlPlayback) {
        progressState.seekTo(state.seekTo);
        return;
      }
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
    [
      canControlPlayback,
      clearScheduledTimeout,
      progressState,
      scheduleSyncedAction,
    ],
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
    if (!activeTrack) return;

    const currentQueueTrack = queue[0];
    if (!currentQueueTrack) return;

    const activeKey = activeTrack.videoId || activeTrack.id;
    if (!activeKey || queueAdvanceLockRef.current === activeKey) return;
    queueAdvanceLockRef.current = activeKey;

    sendTrackEnded(
      activeTrack.duration_ms ? activeTrack.duration_ms / 1000 : 0,
    );

    const isCurrentQueueTrack =
      currentQueueTrack.videoId === activeTrack.videoId ||
      currentQueueTrack.id === activeTrack.id;

    if (isCurrentQueueTrack) {
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

      if (nextTrack && nextTrack.id !== currentQueueTrack.id) {
        cycleQueueCurrent(currentQueueTrack.id);
      } else if (!nextTrack && queue.length === 1) {
        // If there's only one song, just cycle it so it's not removed
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
    } else {
      // If the currently playing track is NOT the first track in the queue,
      // it means we just finished playing a one-off track or skipped into a manual track.
      // We should start playing the first track in the queue!
      sendPlay({
        id: currentQueueTrack.id,
        videoId: currentQueueTrack.videoId,
        trackName: currentQueueTrack.name,
        artistName: currentQueueTrack.artists?.[0]?.name ?? "",
        image: currentQueueTrack.image ?? "",
        currentTime: 0,
        duration_ms: currentQueueTrack.duration_ms,
      });
    }
  }, [
    cycleQueueCurrent,
    canControlPlayback,
    joined,
    playbackMode.repeatMode,
    playbackMode.shuffle,
    playerState.nowPlaying,
    queue,
    sendTrackEnded,
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
      playerState.playTrack(track, 0, true);
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
    [canControlPlayback, playerState.playTrack, sendPlay, setQueue],
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

  /* ─── Background Video Looper ──────────────────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const forcePlay = () => {
      if (video.paused) {
        video.play().catch((err) => {
          console.debug("Video play auto-recovery triggered:", err);
        });
      }
    };

    forcePlay();

    video.addEventListener("pause", forcePlay);
    video.addEventListener("ended", forcePlay);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        forcePlay();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const intervalId = setInterval(forcePlay, 5000);

    return () => {
      video.removeEventListener("pause", forcePlay);
      video.removeEventListener("ended", forcePlay);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(intervalId);
    };
  }, []);

  /* ─── Seek / play-pause / shuffle / repeat / skip ──────────────── */
  const handleSeekAction = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canControlPlayback || !progressState.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const seekToTime =
      ((e.clientX - rect.left) / rect.width) * progressState.duration;
    progressState.seekTo(seekToTime);
    sendSeek(seekToTime);
  };
  const handlePlayPauseAction = useCallback(() => {
    if (!canControlPlayback || !playerState.nowPlaying?.videoId) return;
    if (playerState.playerState === "playing") {
      // Optimistic: pause locally first, then tell server
      playerState.pause?.();
      sendPause(progressState.currentTime);
      return;
    }
    // Optimistic: play locally first, then tell server
    playerState.play?.();
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
    playerState.pause,
    playerState.play,
    progressState.currentTime,
    sendPause,
    sendPlay,
  ]);

  const handleSkipForward = useCallback(() => {
    if (!canControlPlayback || !joined) return;
    const currentIdx = queue.findIndex(
      (t) =>
        t.videoId === playerState.nowPlaying?.videoId ||
        t.id === playerState.nowPlaying?.id,
    );
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
    playerState.playTrack(nextTrack, 0, true);
    sendPlay({
      id: nextTrack.id,
      videoId: nextTrack.videoId,
      trackName: nextTrack.name,
      artistName: nextTrack.artists?.[0]?.name ?? "",
      image: nextTrack.image ?? "",
      currentTime: 0,
      duration_ms: nextTrack.duration_ms,
    });
  }, [
    canControlPlayback,
    joined,
    playbackMode.repeatMode,
    playbackMode.shuffle,
    playerState.nowPlaying,
    queue,
    sendPlay,
  ]);

  const handleSkipBack = useCallback(() => {
    if (!canControlPlayback || !joined) return;
    // If more than 3 seconds in, restart current track
    if (progressState.currentTime > 3 && playerState.nowPlaying) {
      sendPlay({
        id: playerState.nowPlaying.id,
        videoId: playerState.nowPlaying.videoId,
        trackName: playerState.nowPlaying.name,
        artistName: playerState.nowPlaying.artists?.[0]?.name ?? "",
        image: playerState.nowPlaying.image ?? "",
        currentTime: 0,
        duration_ms: playerState.nowPlaying.duration_ms,
      });
      return;
    }
    // Otherwise go to previous track in queue (wrap if repeat all)
    const currentIdx = queue.findIndex(
      (t) =>
        t.videoId === playerState.nowPlaying?.videoId ||
        t.id === playerState.nowPlaying?.id,
    );
    const prevIdx =
      currentIdx > 0
        ? currentIdx - 1
        : playbackMode.repeatMode === "all"
          ? queue.length - 1
          : -1;
    if (prevIdx < 0 || !queue[prevIdx]) return;
    const prevTrack = queue[prevIdx];
    playerState.playTrack(prevTrack, 0, true);
    sendPlay({
      id: prevTrack.id,
      videoId: prevTrack.videoId,
      trackName: prevTrack.name,
      artistName: prevTrack.artists?.[0]?.name ?? "",
      image: prevTrack.image ?? "",
      currentTime: 0,
      duration_ms: prevTrack.duration_ms,
    });
  }, [
    canControlPlayback,
    joined,
    playbackMode.repeatMode,
    playerState.nowPlaying,
    progressState.currentTime,
    queue,
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
    [
      openSearchOverlay,
      searchState.doSearch,
      searchState.setResults,
      suggestState.hideSuggestions,
    ],
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
  const popularGenres = [
    "Pop hits",
    "Hip hop",
    "Lo-fi",
    "Rock classics",
    "Bollywood",
    "EDM",
  ];

  if (authLoading || !joined) {
    return <RoomLoading />;
  }

  return (
    <div className="w-full h-full">
      <YouTubeIframe />
      <div className="w-full h-full  bg-[#F9DBE0] absolute -z-10"></div>

      <div className="h-screen  overflow-hidden bg-cover bg-center bg-fixed">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="absolute bottom-0  right-0 w-2/3 h-full object-cover"
          style={{ zIndex: -1 }}
        >
          <source src="/dance.mp4" type="video/mp4" />
        </video>
        <div className="h-screen w-full overflow-hidden bg-black/50">
          <div
            className="mx-auto flex h-full flex-col pb-40"
            style={{ width: "clamp(10rem, 58vw, 12000rem)" }}
          >
            {/* TopBar — NOT clickable as a whole, RoomTopBar handles its own search bar click internally */}
            <RoomTopBar
              roomName={room?.name ?? "Room"}
              roomCode={code}
              isHost={isHost}
              connected={connected}
              track={footerTrack}
              roomTheme={roomTheme}
              activeVideoId={
                playerState.activeVideoId ?? playback?.videoId ?? null
              }
              playerState={footerPlayerState}
              onCopyInvite={() =>
                navigator.clipboard.writeText(window.location.href)
              }
              onLeave={handleLeave}
              onSearchClick={openSearchOverlay}
              onChatToggle={() => setChatOpen(!chatOpen)}
            />

            <div className="flex h-full gap-4 pt-4 min-h-0">
              <div className="relative w-full h-full flex min-h-0 flex-1 gap-3">
                <aside className={`${chatOpen ? 'w-[30%]' : 'w-[55%]'} h-full shrink-0 min-h-0 rounded-[20px] border border-white/20 transition-all duration-300`}>
                  <SquarePlayer
                    track={footerTrack}
                    activeVideoId={
                      playerState.activeVideoId ?? playback?.videoId ?? null
                    }
                    playerState={footerPlayerState}
                    progress={progressState.progress}
                    currentTime={progressState.currentTime}
                    duration={progressState.duration}
                    volume={playerState.volume}
                    isMuted={playerState.isMuted}
                    shuffleEnabled={playbackMode.shuffle}
                    repeatMode={playbackMode.repeatMode}
                    onPlayPause={
                      canControlPlayback ? handlePlayPauseAction : undefined
                    }
                    onMute={playerState.toggleMute}
                    onVolume={playerState.handleVolume}
                    onSeek={canControlPlayback ? handleSeekAction : undefined}
                    onToggleShuffle={
                      canControlPlayback ? handleToggleShuffle : undefined
                    }
                    onCycleRepeat={
                      canControlPlayback ? handleCycleRepeat : undefined
                    }
                    onSkipBack={canControlPlayback ? handleSkipBack : undefined}
                    onSkipForward={
                      canControlPlayback ? handleSkipForward : undefined
                    }
                  />
                </aside>

                <aside className={`flex-1 min-w-0 h-full min-h-0 ${chatOpen ? 'w-[35%]' : 'w-[45%]'} rounded-[20px] border border-white/20 overflow-hidden transition-all duration-300`}>
                  <RightSidebar
                    members={members}
                    messages={messages}
                    queue={queue}
                    recentTracks={recentTracks}
                    canControlPlayback={canControlPlayback}
                    handleAdminPlayTrack={handleAdminPlayTrack}
                    removeFromQueue={removeFromQueue}
                    addToQueue={addToQueue}
                    clearQueue={clearQueue}
                    activeVideoId={
                      playerState.activeVideoId ?? playback?.videoId ?? null
                    }
                    roomTheme={roomTheme}
                    onThemeChange={setRoomTheme}
                    playerState={footerPlayerState}
                  />
                </aside>

                {chatOpen && (
                  <aside className="w-[35%] h-full shrink-0 min-h-0 transition-all duration-300 animate-in slide-in-from-right-8 fade-in">
                    <ChatPanel
                      messages={messages}
                      chatInput={chatInput}
                      setChatInput={setChatInput}
                      handleSendChat={handleSendChat}
                      onClose={() => setChatOpen(false)}
                      track={footerTrack}
                      isPlaying={playerState.playerState === "playing"}
                      canControlPlayback={canControlPlayback}
                      onPlayPause={canControlPlayback ? handlePlayPauseAction : undefined}
                      onSkipBack={canControlPlayback ? handleSkipBack : undefined}
                      onSkipForward={canControlPlayback ? handleSkipForward : undefined}
                      userProfile={{ name: user?.name || user?.email || "U", avatar: user?.avatar }}
                    />
                  </aside>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
          .room-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
          .room-scroll::-webkit-scrollbar-track { background: transparent; }
          .room-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.18); border-radius: 999px; }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

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
        activeTrackId={playerState.nowPlaying?.id ?? null}
        loadingTrackId={null}
        isPlaying={playerState.playerState === "playing"}
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
        avatarUrl={user?.avatar}
        avatarLabel={user?.name || user?.email || "U"}
        popularGenres={popularGenres}
      />
    </div>
  );
}
