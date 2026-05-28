"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import { usePlaylists } from "@/hooks/usePlaylists";
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
  const searchParams = useSearchParams();
  const queuePlaylistId = searchParams
    ? searchParams.get("queuePlaylistId")
    : null;
  const code = (params.code as string)?.toUpperCase();

  const { user, loading: authLoading } = useAuth();
  const { room, joinRoom, leaveRoom } = useRoom();
  const player = usePlayerState();
  const progress = useProgressTracking(player.playerRef, player.playerState);
  const { likedTrackIds, toggleLike } = usePlaylists();
  const searchState = useSearch();
  const suggestState = useSuggestions(API_URL);
  useYouTubeAPI();

  const [chatInput, setChatInput] = useState("");
  const [joined, setJoined] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [roomTheme, setRoomTheme] = useState<RoomTheme>("purple");
  const [joinToasts, setJoinToasts] = useState<
    Array<{ id: string; name: string; avatar?: string }>
  >([]);

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
    unreadChatCount,
    resetUnreadChat,
  } = useRoomSocket({
    roomCode: joined ? code : null,
    chatOpen,
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
      if (player.nowPlaying?.videoId === state.videoId) {
        if (state.isPlaying) player.play?.();
        else player.pause?.();
        progress.seekTo(actualCurrentTime);
      } else {
        player.playTrack(
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
    onMemberJoined: useCallback((user: { name: string; avatar?: string }) => {
      const toastId = Date.now().toString();
      setJoinToasts((prev) => [
        ...prev,
        { id: toastId, name: user.name, avatar: user.avatar },
      ]);
      setTimeout(() => {
        setJoinToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 3000);
    }, []),
  });

  const playbackRef = useRef(playback);
  useEffect(() => {
    playbackRef.current = playback;
  }, [playback]);

  // Automatically queue all songs from imported/custom playlist on join
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
            addToQueue({
              id: t.id,
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
      })
      .catch((err) => console.error("Failed to auto-queue playlist:", err))
      .finally(() => {
        router.replace(`/room/${code}`);
      });
  }, [connected, joined, queuePlaylistId, code, addToQueue, router]);

  const isHost = room?.hostId === user?.sub || socketIsHost;
  const isHostPresent = room?.hostId
    ? members.some((m) => m.userId === room.hostId)
    : false;
  const canControlPlayback = isHost || !isHostPresent;
  const queueAdvanceLockRef = useRef<string | null>(null);

  const playbackTrack = asTrackFromPlayback(playback);
  const lastPlayedTrack = asTrackFromRecent(recentTracks[0]);
  const footerTrack =
    player.nowPlaying ?? playbackTrack ?? lastPlayedTrack;
  const isLiked = footerTrack ? likedTrackIds.has(footerTrack.videoId) : false;
  const handleToggleLike = () => {
    if (footerTrack) {
      toggleLike(footerTrack);
    }
  };
  const footerPlayerState =
    player.playerState === "idle" && playback?.videoId
      ? playback.isPlaying
        ? "loading"
        : "paused"
      : player.playerState;
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
        if (player.nowPlaying?.videoId === state.videoId) {
          progress.seekTo(initialSeekTo);
          player.play?.();
        } else {
          player.playTrack(track, initialSeekTo, true);
        }
        return;
      }
      if (player.nowPlaying?.videoId === state.videoId) {
        player.pause?.();
        progress.seekTo(initialSeekTo);
      } else {
        player.playTrack(track, initialSeekTo, false);
      }
      scheduleSyncedAction(
        scheduledPlayTimeoutRef,
        state.targetTime,
        syncedTime,
        () => {
          const liveLateBySec =
            Math.max(syncedTime() - state.targetTime, 0) / 1000;
          const liveSeekTo = state.seekTo + liveLateBySec;
          progress.seekTo(liveSeekTo);
          player.play?.();
        },
      );
    },
    [
      canControlPlayback,
      clearScheduledPlaybackActions,
      player.nowPlaying?.videoId,
      player.pause,
      player.play,
      player.playTrack,
      progress.seekTo,
      scheduleSyncedAction,
    ],
  );

  const scheduleRoomPause = useCallback(
    (state: { targetTime: number }, syncedTime: () => number) => {
      if (canControlPlayback) {
        player.pause?.();
        return;
      }
      clearScheduledTimeout(scheduledPauseTimeoutRef);
      scheduleSyncedAction(
        scheduledPauseTimeoutRef,
        state.targetTime,
        syncedTime,
        () => {
          player.pause?.();
        },
      );
    },
    [
      canControlPlayback,
      clearScheduledTimeout,
      player.pause,
      scheduleSyncedAction,
    ],
  );
  const scheduleRoomSeek = useCallback(
    (
      state: { seekTo: number; targetTime: number },
      syncedTime: () => number,
    ) => {
      if (canControlPlayback) {
        progress.seekTo(state.seekTo);
        return;
      }
      clearScheduledTimeout(scheduledSeekTimeoutRef);
      scheduleSyncedAction(
        scheduledSeekTimeoutRef,
        state.targetTime,
        syncedTime,
        () => {
          progress.seekTo(state.seekTo);
        },
      );
    },
    [
      canControlPlayback,
      clearScheduledTimeout,
      progress.seekTo,
      scheduleSyncedAction,
    ],
  );

  /* ─── Playback sync on join ────────────────────────── */
  useEffect(() => {
    if (
      !joined ||
      !playback?.videoId ||
      player.nowPlaying?.videoId === playback.videoId
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
    player.playTrack(
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
    player.nowPlaying?.videoId,
    player.playTrack,
    scheduleRoomPlay,
  ]);

  /* ─── Queue advance ────────────────────────────────── */
  const maybeAdvanceQueue = useCallback(() => {
    if (!canControlPlayback || !joined) return;
    const activeTrack = player.nowPlaying;
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
    player.nowPlaying,
    queue,
    sendTrackEnded,
    sendPlay,
    removeFromQueue,
  ]);

  useEffect(() => {
    if (player.playerState === "ended") maybeAdvanceQueue();
  }, [maybeAdvanceQueue, player.playerState]);
  useEffect(() => {
    const activeKey =
      player.nowPlaying?.videoId || player.nowPlaying?.id || null;
    if (!activeKey) {
      queueAdvanceLockRef.current = null;
      return;
    }
    if (
      queueAdvanceLockRef.current === activeKey &&
      ["loading", "playing"].includes(player.playerState) &&
      progress.currentTime < 2
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
    player.nowPlaying?.id,
    player.nowPlaying?.videoId,
    player.playerState,
    progress.currentTime,
  ]);

  useEffect(() => {
    if (
      !canControlPlayback ||
      !joined ||
      player.playerState !== "playing" ||
      !player.nowPlaying?.duration_ms
    )
      return;
    const activeTrack = player.nowPlaying;
    const currentQueueTrack = queue[0];
    if (
      !currentQueueTrack ||
      (currentQueueTrack.videoId !== activeTrack.videoId &&
        currentQueueTrack.id !== activeTrack.id)
    )
      return;
    const remainingMs = Math.max(
      activeTrack.duration_ms - progress.currentTime * 1000,
      0,
    );
    const timeoutId = window.setTimeout(() => {
      const ref = player.playerRef.current;
      const currentTime =
        ref?.getCurrentTime?.() ?? progress.currentTime;
      const duration =
        ref?.getDuration?.() ?? activeTrack.duration_ms / 1000;
      const isNearEnd =
        duration > 0 && currentTime >= Math.max(duration - 2, 0);
      if (player.playerState === "ended" || isNearEnd) maybeAdvanceQueue();
    }, remainingMs + 2500);
    return () => window.clearTimeout(timeoutId);
  }, [
    canControlPlayback,
    joined,
    maybeAdvanceQueue,
    player.nowPlaying,
    player.playerRef,
    player.playerState,
    progress.currentTime,
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
      player.playTrack(track, 0, true);
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
    [canControlPlayback, player.playTrack, sendPlay, setQueue],
  );

  /* ─── Background audio keeper ──────────────────────── */
  const audioContextRef = useRef<AudioContext | null>(null);
  const silentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const startOrResumeAudio = () => {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      try {
        if (!audioContextRef.current) audioContextRef.current = new AC();
        const ctx = audioContextRef.current;
        if (ctx.state === "suspended") ctx.resume();

        if (!silentSourceRef.current) {
          const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++)
            d[i] = (Math.random() - 0.5) * 0.00001;
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.loop = true;
          const g = ctx.createGain();
          g.gain.value = 0.0001;
          src.connect(g);
          g.connect(ctx.destination);
          src.start(0);
          silentSourceRef.current = src;
        }

        const cp = playbackRef.current;
        if (cp?.isPlaying && player.playerRef.current) {
          try {
            const st = player.playerRef.current.getPlayerState?.();
            if (st !== 1) player.playerRef.current.playVideo?.();
          } catch (e) { /* ignore */ }
        }
      } catch (err) {
        console.error("Failed to start background tab keeper:", err);
      }
    };

    const events = ["click", "keydown", "touchstart", "mousedown"];
    const interact = () => {
      startOrResumeAudio();
      events.forEach((evt) => window.removeEventListener(evt, interact));
    };
    events.forEach((evt) =>
      window.addEventListener(evt, interact, { once: true }),
    );

    const onVisible = () => {
      if (document.visibilityState === "visible") startOrResumeAudio();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, interact));
      document.removeEventListener("visibilitychange", onVisible);
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      silentSourceRef.current = null;
    };
  }, []);

  /* ─── Media Session API ────────────────────────────── */
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
    const t = footerTrack;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: t?.name || "Blu3",
      artist: t?.artists?.[0]?.name || "",
      album: "",
      artwork: t?.image
        ? [{ src: t.image, sizes: "512x512", type: "image/jpeg" }]
        : [],
    });
    navigator.mediaSession.playbackState =
      player.playerState === "playing" ? "playing" : "paused";
  }, [footerTrack, player.playerState]);

  const handleSeekAction = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canControlPlayback || !progress.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const seekToTime =
      ((e.clientX - rect.left) / rect.width) * progress.duration;
    progress.seekTo(seekToTime);
    sendSeek(seekToTime);
  };
  const handlePlayPauseAction = useCallback(() => {
    if (!canControlPlayback) return;

    // Nothing is playing — start the first track in queue if available
    if (!player.nowPlaying?.videoId) {
      const firstTrack = queue[0];
      if (!firstTrack) return;
      player.playTrack(firstTrack, 0, true);
      sendPlay({
        id: firstTrack.id,
        videoId: firstTrack.videoId,
        trackName: firstTrack.name,
        artistName: firstTrack.artists?.[0]?.name ?? "",
        image: firstTrack.image ?? "",
        currentTime: 0,
        duration_ms: firstTrack.duration_ms,
      });
      return;
    }

    if (player.playerState === "playing") {
      // Optimistic: pause locally first, then tell server
      player.pause?.();
      sendPause(progress.currentTime);
      return;
    }
    // Optimistic: play locally first, then tell server
    player.play?.();
    sendPlay({
      id: player.nowPlaying.id,
      videoId: player.nowPlaying.videoId,
      trackName: player.nowPlaying.name,
      artistName: player.nowPlaying.artists?.[0]?.name ?? "",
      image: player.nowPlaying.image ?? "",
      currentTime: progress.currentTime,
      duration_ms: player.nowPlaying.duration_ms,
    });
  }, [
    canControlPlayback,
    player.nowPlaying,
    player.playerState,
    player.pause,
    player.play,
    progress.currentTime,
    queue,
    sendPause,
    sendPlay,
    player.playTrack,
  ]);

  const handleListenerPlay = useCallback(() => {
    if (!playback?.isPlaying) return;
    let actualCurrentTime = playback.currentTime ?? 0;
    if (playback.updatedAt) {
      const elapsed = (getSyncedTime() - playback.updatedAt) / 1000;
      if (elapsed > 0 && elapsed < 3600) actualCurrentTime += elapsed;
    }
    progress.seekTo(actualCurrentTime);
    player.play?.();
  }, [playback, getSyncedTime, progress.seekTo, player.play]);

  const onPlayPauseAction = canControlPlayback
    ? handlePlayPauseAction
    : playback?.isPlaying && player.playerState !== "playing"
      ? handleListenerPlay
      : undefined;

  const handleSkipForward = useCallback(() => {
    if (!canControlPlayback || !joined) return;
    const currentIdx = queue.findIndex(
      (t) =>
        t.videoId === player.nowPlaying?.videoId ||
        t.id === player.nowPlaying?.id,
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
    player.playTrack(nextTrack, 0, true);
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
    player.nowPlaying,
    queue,
    sendPlay,
  ]);

  const handleSkipBack = useCallback(() => {
    if (!canControlPlayback || !joined) return;
    // If more than 3 seconds in, restart current track
    if (progress.currentTime > 3 && player.nowPlaying) {
      sendPlay({
        id: player.nowPlaying.id,
        videoId: player.nowPlaying.videoId,
        trackName: player.nowPlaying.name,
        artistName: player.nowPlaying.artists?.[0]?.name ?? "",
        image: player.nowPlaying.image ?? "",
        currentTime: 0,
        duration_ms: player.nowPlaying.duration_ms,
      });
      return;
    }
    // Otherwise go to previous track in queue (wrap if repeat all)
    const currentIdx = queue.findIndex(
      (t) =>
        t.videoId === player.nowPlaying?.videoId ||
        t.id === player.nowPlaying?.id,
    );
    const prevIdx =
      currentIdx > 0
        ? currentIdx - 1
        : playbackMode.repeatMode === "all"
          ? queue.length - 1
          : -1;
    if (prevIdx < 0 || !queue[prevIdx]) return;
    const prevTrack = queue[prevIdx];
    player.playTrack(prevTrack, 0, true);
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
    player.nowPlaying,
    progress.currentTime,
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
      localStorage.setItem("blu3_last_room", code);
      return;
    }
    joinRoom(code).then((r) => {
      if (r) {
        setJoined(true);
        localStorage.setItem("blu3_last_room", code);
      } else router.replace("/browse");
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
    if (!joined || !canControlPlayback || !player.nowPlaying?.videoId)
      return;
    const playbackState =
      player.playerState === "playing"
        ? "playing"
        : player.playerState === "paused"
          ? "paused"
          : player.playerState === "loading"
            ? "buffering"
            : null;
    if (!playbackState) return;
    const liveCurrentTime =
      player.playerRef.current?.getCurrentTime?.() ??
      progress.currentTime;
    sendPlaybackState(playbackState, liveCurrentTime);
  }, [
    canControlPlayback,
    joined,
    player.nowPlaying?.videoId,
    player.playerRef,
    player.playerState,
    sendPlaybackState,
  ]);
  useEffect(() => {
    if (!joined || !canControlPlayback || player.playerState !== "playing")
      return;
    const heartbeatId = window.setInterval(() => {
      const liveCurrentTime =
        player.playerRef.current?.getCurrentTime?.() ??
        progress.currentTime;
      sendPlaybackState("playing", liveCurrentTime);
    }, 2000);
    return () => window.clearInterval(heartbeatId);
  }, [
    canControlPlayback,
    joined,
    player.playerRef,
    player.playerState,
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
  /* ─── Background Video Looper ──────────────────────── */
  useEffect(() => {
    if (!joined) return;
    const video = videoRef.current;
    if (!video) return;

    const LOOP_START = 10.58;
    const LOOP_END = 17.6; // a bit before 17.9 — gives rAF time to catch it

    let rafId: number;

    const forcePlay = () => {
      if (video.paused) video.play().catch(() => {});
    };

    const tick = () => {
      if (video.currentTime >= LOOP_END) {
        video.currentTime = LOOP_START;
        // No need to call play() here — video wasn't paused, just seeking
      }
      rafId = requestAnimationFrame(tick);
    };

    const handleEnded = () => {
      video.currentTime = LOOP_START;
      forcePlay();
    };

    forcePlay();
    rafId = requestAnimationFrame(tick);

    video.addEventListener("ended", handleEnded);
    video.addEventListener("pause", forcePlay);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") forcePlay();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("pause", forcePlay);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [joined]);

  if (authLoading || !joined) {
    return <RoomLoading />;
  }

  return (
    <div className="w-full h-full bg-black relative">
      <YouTubeIframe />

      {footerTrack?.image && (
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="w-full h-full bg-cover bg-center scale-[1.75] blur-xl"
            style={{ backgroundImage: `url(${footerTrack.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black/80" />
        </div>
      )}

      <div className="relative z-10 h-screen w-full overflow-hidden">
        <div
          className="mx-auto flex h-full flex-col pb-6 lg:pb-20 px-3
              w-full sm:w-full md:w-[90%] lg:w-[75%] xl:w-[65%] 2xl:w-[60%]
              overflow-y-auto lg:overflow-hidden"
        >
          <RoomTopBar
            roomName={room?.name ?? "Room"}
            roomCode={code}
            isHost={isHost}
            connected={connected}
            track={footerTrack}
            roomTheme={roomTheme}
            activeVideoId={
              player.activeVideoId ?? playback?.videoId ?? null
            }
            playerState={footerPlayerState}
            onCopyInvite={() =>
              navigator.clipboard.writeText(window.location.href)
            }
            onLeave={handleLeave}
            onSearchClick={openSearchOverlay}
          />

          <div className="flex h-full gap-2 pt-2 min-h-0">
            <div className="relative w-full h-full flex flex-col lg:flex-row min-h-0 flex-1 gap-4 pb-12 lg:pb-0">
              <aside className="w-full lg:w-[55%] h-fit lg:h-full shrink-0 min-h-[420px] lg:min-h-0 rounded-[24px] border border-white/[0.08] bg-white/[0.05] backdrop-blur-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all duration-300 before:absolute before:inset-0 before:rounded-[24px] before:pointer-events-none before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent">
                {chatOpen ? (
                  <div className="absolute inset-0 animate-in fade-in duration-300">
                    <ChatPanel
                      messages={messages}
                      chatInput={chatInput}
                      setChatInput={setChatInput}
                      handleSendChat={handleSendChat}
                      onClose={() => setChatOpen(false)}
                      track={footerTrack}
                      isPlaying={player.playerState === "playing"}
                      canControlPlayback={canControlPlayback}
                      onPlayPause={onPlayPauseAction}
                      onSkipBack={
                        canControlPlayback ? handleSkipBack : undefined
                      }
                      onSkipForward={
                        canControlPlayback ? handleSkipForward : undefined
                      }
                      userProfile={{
                        name: user?.name || user?.email || "U",
                        avatar: user?.avatar,
                      }}
                    />
                  </div>
                ) : (
                  <SquarePlayer
                    track={footerTrack}
                    activeVideoId={
                      player.activeVideoId ?? playback?.videoId ?? null
                    }
                    playerState={footerPlayerState}
                    isLiked={isLiked}
                    onToggleLike={handleToggleLike}
                    progress={progress.progress}
                    currentTime={progress.currentTime}
                    duration={progress.duration}
                    volume={player.volume}
                    isMuted={player.isMuted}
                    shuffleEnabled={playbackMode.shuffle}
                    repeatMode={playbackMode.repeatMode}
                    onPlayPause={onPlayPauseAction}
                    onMute={player.toggleMute}
                    onVolume={player.handleVolume}
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
                )}
              </aside>

              <aside className="flex-1 min-w-0 w-full lg:w-[45%] h-[55vh] lg:h-full shrink-0 min-h-[380px] lg:min-h-0 rounded-[24px] border border-white/[0.08] bg-white/[0.05] backdrop-blur-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 before:absolute before:inset-0 before:rounded-[24px] before:pointer-events-none before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent">
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
                    player.activeVideoId ?? playback?.videoId ?? null
                  }
                  roomTheme={roomTheme}
                  onThemeChange={setRoomTheme}
                  playerState={footerPlayerState}
                  onChatToggle={() => setChatOpen(!chatOpen)}
                  onSearchClick={openSearchOverlay}
                />
              </aside>
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
        activeTrackId={player.nowPlaying?.id ?? null}
        loadingTrackId={null}
        isPlaying={player.playerState === "playing"}
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
