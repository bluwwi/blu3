"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import { useAuth } from "@/hooks/useAuth";
import { usePlayerState } from "@/hooks/usePlayerState";
import { useProgressTracking } from "@/hooks/useProgressTracking";
import { useBackgroundAudio } from "@/hooks/useBackgroundAudio";
import { resolveTrackSource } from "@/utils/ytdl";

import { useSearch } from "@/hooks/useSearch";
import { useSuggestions } from "@/hooks/useSuggestions";
import { fadeSeek } from "@/utils/audioFade";
import { onVisibilityChange } from "@/utils/visibilityCoordinator";
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
import { ChatPanel } from "@/components/Player/ui/ChatPanel";
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
  const setPlayerStateRef = useRef<((s: PlayerState) => void) | null>(null);
  const manualPauseRef = useRef(false);
  const player = usePlayerState();
  setPlayerStateRef.current = player.setPlayerState;
  const token =
    typeof window !== "undefined"
      ? (localStorage.getItem("blu3_token") ?? undefined)
      : undefined;
  const resolvedUrlsRef = useRef(new Map<string, string>());
  const resolvedTimestampsRef = useRef(new Map<string, number>());
  const resolvingRef = useRef(new Set<string>());
  const [retryKey, setRetryKey] = useState(0);
  const forceRetry = useCallback(() => setRetryKey((k) => k + 1), []);

  const { audioRef, retryPlay } = useBackgroundAudio({
    nowPlaying: player.nowPlaying,
    isPlaying: player.playing,
    volume: player.volume,
    isMuted: player.isMuted,
    token,
    onPlay: () => player.handlePlayEvent(),
    onPause: () => player.handlePauseEvent(),
    onTrackEnd: () => player.setPlayerState("ended"),
    pendingStartTimeRef: player.pendingStartTimeRef,
    manualPauseRef,
    resolvedUrlsRef,
    resolvedTimestampsRef,
    retryKey,
  });

  const progress = useProgressTracking(player.playerState, audioRef);

  const { likedTrackIds, toggleLike } = usePlaylists();
  const searchState = useSearch();
  const suggestState = useSuggestions(API_URL);

  const [chatInput, setChatInput] = useState("");
  const [joined, setJoined] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [roomTheme, setRoomTheme] = useState<RoomTheme>("purple");
  const [listenerMuted, setListenerMuted] = useState(false);
  const [joinToasts, setJoinToasts] = useState<
    Array<{ id: string; name: string; avatar?: string }>
  >([]);
  const [queueToast, setQueueToast] = useState<{
    playlistName: string;
    image: string;
    trackCount: number;
  } | null>(null);
  const [joinErrorMessage, setJoinErrorMessage] = useState<string | null>(null);
  const [starsMounted, setStarsMounted] = useState(false);

  useEffect(() => {
    setStarsMounted(true);
  }, []);

  const originalQueueRef = useRef<Track[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    connected,
    initialDataLoaded,
    isHost: socketIsHost,
    isHostActive,
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
    sendPlaybackMode,
    sendProgress,
    sendTrackEnded,
    getSyncedTime,
    getSyncedPosition,
    requestSync,
    addToQueue,
    removeFromQueue,
    cycleQueueCurrent,
    clearQueue,
    unreadChatCount,
    resetUnreadChat,
  } = useRoomSocket({
    roomCode: joined ? code : null,
    chatOpen,
    onPlay: (state) => handlePlay(state),
    onPause: () => handlePause(),
    onSeek: (state) => handleSeek(state),
    onPlaybackSync: (state, syncedTime) => {
      if (!state.videoId) {
        if (playerRef_fix.current.playerState !== "idle") {
          playerRef_fix.current.setPlayerState("idle");
          playerRef_fix.current.setNowPlaying(null);
          playerRef_fix.current.pause?.();
        }
        syncHandledRef.current = true;
        return;
      }
      syncHandledRef.current = true;
      let actualCurrentTime = state.currentTime ?? 0;
      if (state.updatedAt) {
        const elapsed = (syncedTime() - state.updatedAt) / 1000;
        if (elapsed > 0 && elapsed < 3600) actualCurrentTime += elapsed;
      }
      const p = playerRef_fix.current;
      if (p.nowPlaying?.videoId === state.videoId) {
        const actualTime = audioRef.current?.currentTime ?? 0;
        const drift = Math.abs(actualTime - actualCurrentTime);
        if (drift > 1.5) {
          seekWithFade(actualCurrentTime);
        }
        if (state.isPlaying) {
          if (p.playerState === "ended" || p.playerState === "loading") {
            forceRetry();
          } else {
            p.play?.();
          }
        } else {
          p.pause?.();
        }
      } else {
        p.playTrack(
          {
            id: `room-${state.videoId}`,
            source: (state as any).source ?? "youtube",
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
        progressRef_fix.current.seekTo(actualCurrentTime);
        if (state.isPlaying) p.play?.();
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

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      const MAX_PREFETCH = 5;
      let resolved = 0;
      for (const track of queue) {
        if (resolved >= MAX_PREFETCH) break;
        const videoId = track.videoId;
        if (!videoId) continue;
        if (resolvedUrlsRef.current.has(videoId)) continue;
        if (resolvingRef.current.has(videoId)) continue;

        resolvingRef.current.add(videoId);
        resolved++;
        resolveTrackSource(videoId, track.name, track.artists?.[0]?.name, token)
          .then((result) => {
            if (result.audioUrl) {
              resolvedUrlsRef.current.set(videoId, result.audioUrl);
              resolvedTimestampsRef.current.set(videoId, Date.now());
            }
          })
          .catch(() => {})
          .finally(() => {
            resolvingRef.current.delete(videoId);
          });
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [queue, token]);

  const playbackRef = useRef(playback);
  useEffect(() => {
    playbackRef.current = playback;
  }, [playback]);

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
          [...data.tracks].reverse().forEach((t: any) => {
            addToQueue({
              id: t.id,
              source: "youtube",
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

  const isHost = room?.hostId === user?.id || socketIsHost;
  const canControlPlayback = isHost || !isHostActive || user?.role === "admin";
  const queueAdvanceLockRef = useRef<string | null>(null);
  const syncHandledRef = useRef(false);
  const joinedRef = useRef(joined);
  joinedRef.current = joined;
  const canControlPlaybackRef = useRef(canControlPlayback);
  const playerRef_fix = useRef(player);
  const progressRef_fix = useRef(progress);
  useEffect(() => {
    canControlPlaybackRef.current = canControlPlayback;
  }, [canControlPlayback]);
  useEffect(() => {
    playerRef_fix.current = player;
  }, [player]);
  useEffect(() => {
    progressRef_fix.current = progress;
  }, [progress]);

  const playbackTrack = asTrackFromPlayback(playback);
  const lastPlayedTrack = asTrackFromRecent(recentTracks[0]);
  const footerTrack = player.nowPlaying ?? playbackTrack ?? lastPlayedTrack;
  const footerPlayerState =
    player.playerState === "idle" && playback?.videoId
      ? playback.isPlaying
        ? "loading"
        : "paused"
      : player.playerState;

  const displayProgress = progress.progress;
  const displayCurrentTime = progress.currentTime;
  const displayDuration = progress.duration;

  const isLiked = player.nowPlaying?.videoId
    ? likedTrackIds.has(player.nowPlaying.videoId)
    : false;
  const handleToggleLike = useCallback(() => {
    if (player.nowPlaying) toggleLike(player.nowPlaying);
  }, [player.nowPlaying, toggleLike]);

  const seekWithFade = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      fadeSeek(audio, time);
    }
    progressRef_fix.current.seekTo(time);
  }, []);

  const handlePlay = useCallback(
    (state: {
      videoId: string;
      seekTo: number;
      serverTime: number;
      id?: string;
      trackName?: string;
      artistName?: string;
      image?: string;
      duration_ms?: number;
    }) => {
      if (!state.videoId) return;
      const elapsed = Math.max(0, (getSyncedTime() - state.serverTime) / 1000);
      const adjustedSeek = state.seekTo > 0 ? state.seekTo + elapsed : 0;

      const track = {
        id: state.id ?? `room-${state.videoId}`,
        source: (state as any).source ?? "youtube",
        videoId: state.videoId,
        name: state.trackName ?? "Playing from room",
        duration_ms: state.duration_ms ?? 0,
        explicit: false,
        artists: [{ name: state.artistName ?? "" }],
        album: { name: "" },
        image: state.image ?? "",
      };

      if (player.nowPlaying?.videoId === state.videoId) {
        progress.seekTo(adjustedSeek);
        player.play?.();
      } else {
        player.playTrack(track, adjustedSeek, true);
      }
    },
    [
      getSyncedTime,
      player.nowPlaying?.videoId,
      player.play,
      player.playTrack,
      progress,
    ],
  );

  const handlePause = useCallback(() => {
    player.pause?.();
  }, [player.pause]);

  const handleSeek = useCallback(
    (state: { seekTo: number; serverTime: number }) => {
      progress.seekTo(state.seekTo);
    },
    [progress],
  );

  const prevConnected = useRef(connected);
  useEffect(() => {
    if (connected && !prevConnected.current) {
      syncHandledRef.current = false;
    }
    prevConnected.current = connected;
  }, [connected]);

  useEffect(() => {
    if (
      !joined ||
      !playback?.videoId ||
      player.nowPlaying?.videoId === playback.videoId ||
      syncHandledRef.current
    )
      return;

    if (!canControlPlayback && playback.isPlaying) {
      const p = playerRef_fix.current;
      let time = playback.currentTime ?? 0;
      if (playback.updatedAt) {
        const elapsed = (getSyncedTime() - playback.updatedAt) / 1000;
        if (elapsed > 0 && elapsed < 3600) time += elapsed;
      }
      if (!player.isMuted) player.toggleMute();
      p.playTrack(
        {
          id: `room-${playback.videoId}`,
          source: playback.source ?? "youtube",
          videoId: playback.videoId,
          name: playback.trackName,
          duration_ms: 0,
          explicit: false,
          artists: [{ name: playback.artistName }],
          album: { name: "" },
          image: playback.image,
        },
        time,
        true,
      );
      p.play?.();
      setListenerMuted(true);
    }
  }, [joined, playback, player.nowPlaying?.videoId, canControlPlayback]);

  const maybeAdvanceQueue = useCallback(() => {
    if (!canControlPlaybackRef.current || !joined) return;
    const p = playerRef_fix.current;
    const activeTrack = p.nowPlaying;
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
        p.playTrack(
          {
            id: activeTrack.id,
            source: activeTrack.source ?? "youtube",
            videoId: activeTrack.videoId,
            name: activeTrack.name,
            duration_ms: activeTrack.duration_ms,
            explicit: false,
            artists: activeTrack.artists ?? [{ name: "" }],
            album: activeTrack.album ?? { name: "" },
            image: activeTrack.image ?? "",
          },
          0,
          true,
        );
        sendPlay({
          id: activeTrack.id,
          source: activeTrack.source ?? "youtube",
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
        cycleQueueCurrent(currentQueueTrack.id);
      }

      if (nextTrack) {
        p.playTrack(
          {
            id: nextTrack.id,
            source: nextTrack.source ?? "youtube",
            videoId: nextTrack.videoId,
            name: nextTrack.name,
            duration_ms: nextTrack.duration_ms,
            explicit: false,
            artists: nextTrack.artists ?? [{ name: "" }],
            album: nextTrack.album ?? { name: "" },
            image: nextTrack.image ?? "",
          },
          0,
          true,
        );
        sendPlay({
          id: nextTrack.id,
          source: nextTrack.source ?? "youtube",
          videoId: nextTrack.videoId,
          trackName: nextTrack.name,
          artistName: nextTrack.artists?.[0]?.name ?? "",
          image: nextTrack.image ?? "",
          currentTime: 0,
          duration_ms: nextTrack.duration_ms,
        });
      }
    } else {
      p.playTrack(
        {
          id: currentQueueTrack.id,
          source: currentQueueTrack.source ?? "youtube",
          videoId: currentQueueTrack.videoId,
          name: currentQueueTrack.name,
          duration_ms: currentQueueTrack.duration_ms,
          explicit: false,
          artists: currentQueueTrack.artists ?? [{ name: "" }],
          album: currentQueueTrack.album ?? { name: "" },
          image: currentQueueTrack.image ?? "",
        },
        0,
        true,
      );
      sendPlay({
        id: currentQueueTrack.id,
        source: currentQueueTrack.source ?? "youtube",
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
      const currentTime = progress.currentTime;
      const duration = activeTrack.duration_ms / 1000;
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
    player.playerState,
    progress.currentTime,
    queue,
  ]);

  const handleAdminPlayTrack = useCallback(
    (track: Track) => {
      if (!canControlPlayback || !track.videoId) return;
      setQueue((prev) => {
        const filtered = prev.filter(
          (t) => t.id !== track.id || t.videoId !== track.videoId,
        );
        return [track, ...filtered];
      });
      player.playTrack(track, 0, true);
      sendPlay({
        id: track.id,
        source: track.source ?? "youtube",
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

  const handleSeekAction = useCallback(
    (seekToTime: number) => {
      if (!canControlPlayback || !player.nowPlaying?.videoId) return;
      progress.seekTo(seekToTime);
      sendSeek(seekToTime);
    },
    [canControlPlayback, player.nowPlaying?.videoId, progress, sendSeek],
  );

  const handlePlayPauseAction = useCallback(() => {
    if (!canControlPlayback) return;
    if (!player.nowPlaying?.videoId) {
      const firstTrack = queue[0];
      if (!firstTrack) return;
      player.playTrack(firstTrack, 0, true);
      sendPlay({
        id: firstTrack.id,
        source: firstTrack.source ?? "youtube",
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
      manualPauseRef.current = true;
      player.pause?.();
      sendPause(progress.currentTime);
      return;
    }
    player.play?.();
    sendPlay({
      id: player.nowPlaying.id,
      source: player.nowPlaying.source ?? "youtube",
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
    if (player.isMuted) player.toggleMute();
    progress.seekTo(actualCurrentTime);
    player.play?.();
    setListenerMuted(false);
  }, [playback, getSyncedTime, progress, player]);

  const onPlayPauseAction = canControlPlayback
    ? handlePlayPauseAction
    : listenerMuted || (playback?.isPlaying && player.playerState !== "playing")
      ? handleListenerPlay
      : undefined;

  const handleSkipForward = useCallback(() => {
    if (!canControlPlayback || !joined) return;
    const playingId = player.nowPlaying?.videoId || player.nowPlaying?.id;
    if (!playingId) return;
    const sortedQueue = [...queue].sort((a) =>
      a.videoId === playingId || a.id === playingId ? -1 : 0,
    );
    const currentIdx = sortedQueue.findIndex(
      (t) => t.videoId === playingId || t.id === playingId,
    );
    if (currentIdx === -1) return;
    const currentTrack = queue.find(
      (t) => t.videoId === playingId || t.id === playingId,
    );
    if (currentTrack) cycleQueueCurrent(currentTrack.id);
    const upcomingTracks = sortedQueue.slice(currentIdx + 1);
    const nextTrack =
      upcomingTracks.length > 0
        ? playbackMode.shuffle
          ? upcomingTracks[Math.floor(Math.random() * upcomingTracks.length)]
          : upcomingTracks[0]
        : playbackMode.repeatMode === "all"
          ? sortedQueue[0]
          : null;
    if (!nextTrack) return;
    player.playTrack(nextTrack, 0, true);
    sendPlay({
      id: nextTrack.id,
      source: nextTrack.source ?? "youtube",
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
    cycleQueueCurrent,
  ]);

  const handleVolumeWrapped = useCallback(
    (val: number) => {
      player.handleVolume(val);
    },
    [player],
  );

  const toggleMuteWrapped = useCallback(() => {
    player.toggleMute();
  }, [player]);

  const handleSkipBack = useCallback(() => {
    if (!canControlPlayback || !joined) return;

    const currentTrack = player.nowPlaying;

    if (progress.currentTime > 3) {
      if (!currentTrack?.videoId) return;
      progress.seekTo(0);
      sendSeek(0);
      return;
    }

    const currentIdx = queue.findIndex(
      (t) => t.videoId === currentTrack?.videoId || t.id === currentTrack?.id,
    );
    const prevIdx =
      currentIdx > 0
        ? currentIdx - 1
        : playbackMode.repeatMode === "all"
          ? queue.length - 1
          : -1;
    if (prevIdx < 0 || !queue[prevIdx]) {
      if (!currentTrack?.videoId) return;
      progress.seekTo(0);
      sendSeek(0);
      return;
    }
    const prevTrack = queue[prevIdx];
    player.playTrack(prevTrack, 0, true);
    sendPlay({
      id: prevTrack.id,
      source: prevTrack.source ?? "youtube",
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
    progress,
    player.nowPlaying,
    queue,
    playbackMode.repeatMode,
    sendSeek,
    sendPlay,
  ]);

  const handleToggleShuffle = useCallback(() => {
    if (!canControlPlayback) return;
    const newShuffle = !playbackMode.shuffle;
    sendPlaybackMode({ shuffle: newShuffle });
    if (newShuffle) {
      setQueue((prev) => {
        originalQueueRef.current = [...prev];
        const arr = [...prev];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      });
    } else if (originalQueueRef.current.length > 0) {
      setQueue(originalQueueRef.current);
      originalQueueRef.current = [];
    }
  }, [canControlPlayback, playbackMode.shuffle, sendPlaybackMode, setQueue]);

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

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler("previoustrack", () =>
        handleSkipBack(),
      );
      navigator.mediaSession.setActionHandler("nexttrack", () =>
        handleSkipForward(),
      );
      navigator.mediaSession.setActionHandler("seekbackward", () => {
        const newTime = Math.max(0, progress.currentTime - 10);
        progress.seekTo(newTime);
        if (canControlPlayback) sendSeek(newTime);
      });
      navigator.mediaSession.setActionHandler("seekforward", () => {
        const newTime = Math.min(progress.duration, progress.currentTime + 10);
        progress.seekTo(newTime);
        if (canControlPlayback) sendSeek(newTime);
      });
    } catch {}
  }, [
    handleSkipBack,
    handleSkipForward,
    progress,
    canControlPlayback,
    sendSeek,
  ]);

  useEffect(() => {
    return () => {
      syncHandledRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (authLoading || !user || !code) return;
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

  useEffect(() => {
    let syncTimer: ReturnType<typeof setTimeout> | null = null;
    const unsub = onVisibilityChange((visible) => {
      if (visible) {
        if (syncTimer) clearTimeout(syncTimer);
        syncTimer = setTimeout(() => requestSync(), 300);
      }
    });
    return () => {
      if (syncTimer) clearTimeout(syncTimer);
      unsub();
    };
  }, [requestSync]);

  useEffect(() => {
    if (!joined || !canControlPlayback || !player.nowPlaying?.videoId) return;
    const heartbeatId = window.setInterval(() => {
      if (document.hidden) return;
      if (player.playerState === "playing") sendProgress(progress.currentTime);
    }, 3000);
    return () => window.clearInterval(heartbeatId);
  }, [
    canControlPlayback,
    joined,
    player.nowPlaying?.videoId,
    player.playerState,
    progress.currentTime,
    sendProgress,
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

  useEffect(() => {
    if (!joined) return;
    const video = videoRef.current;
    if (!video) return;

    const LOOP_START = 10.58;
    const LOOP_END = 17.6;
    let rafId: number;

    const forcePlay = () => {
      if (video.paused) video.play().catch(() => {});
    };
    const tick = () => {
      if (video.currentTime >= LOOP_END) video.currentTime = LOOP_START;
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
    const unsub = onVisibilityChange((visible) => {
      if (visible) forcePlay();
    });
    return () => {
      cancelAnimationFrame(rafId);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("pause", forcePlay);
      unsub();
    };
  }, [joined]);

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
          <div className="w-full h-full bg-[#334EAC] relative">
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
              <RoomBackground
                isPlaying={player.playerState === "playing"}
                trackImage={footerTrack?.image}
              />
            </div>

            {starsMounted && <RoomStars />}

            <div className="relative z-10 gap-2 sm:h-dvh items-center justify-center flex flex-col h-full w-full overflow-hidden">

              <div
                className="mx-auto flex sm:border border-white/10 h-full sm:h-[85%] flex-col pb-0  px-0 sm:rounded-3xl
              w-[60%] max-2xl:w-[75%] max-xl:w-[85%] max-lg:w-[92%] max-sm:w-full
              filter shadow-[0_0_40px_rgba(0,0,0,0.6)]
              sm:filter sm:shadow-[0_0_60px_rgba(0,0,0,0.5)] "
              >
                <div className="flex h-full mt-0  gap-0 sm:gap-2 pt-0  min-h-0">
                  <div className="relative w-full h-full flex flex-col lg:flex-row min-h-0 flex-1 gap-7 sm:gap-3 pb-0  lg:pb-0">
                    <aside
                      className="
                  w-full lg:w-[55%] h-full lg:h-full shrink-0 min-h-125 sm:min-h-0 lg:min-h-0
                  max-sm:rounded-none sm:rounded-3xl
                  max-sm:border-0 sm:border sm:border-white/10
                  max-sm:bg-transparent sm:bg-white/5
                  max-sm:backdrop-blur-none sm:backdrop-blur-2xl

                  filter drop-shadow-[0_0_40px_rgba(0,0,0,1)]
                  sm:filter sm:drop-shadow-[0_0_60px_rgba(0,0,0,1)]

                  overflow-visible

                  relative transition-all duration-300
                  max-sm:before:hidden sm:before:absolute sm:before:inset-0 sm:before:rounded-3xl sm:before:pointer-events-none sm:before:bg-linear-to-b sm:before:from-white/4 sm:before:to-transparent
                "
                    >
                      {chatOpen ? (
                        <div className="absolute inset-0 animate-in p-3 sm:p-0 fade-in duration-300">
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
                              avatar: user?.avatar ?? undefined,
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
                          progress={displayProgress}
                          currentTime={displayCurrentTime}
                          duration={displayDuration}
                          volume={player.volume}
                          isMuted={player.isMuted}
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
                      )}
                    </aside>

                    <aside
                      className="
                  flex-1 min-w-0 w-full lg:w-[45%] h-full lg:h-full shrink-0 min-h-95 sm:min-h-0 lg:min-h-0
                  max-sm:rounded-none sm:rounded-3xl
                  max-sm:border-0 sm:border-2 sm:border-white/8
                  max-sm:bg-transparent sm:bg-white/5
                  max-sm:backdrop-blur-none sm:backdrop-blur-2xl

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
                        messages={messages}
                        queue={queue}
                        recentTracks={recentTracks}
                        canControlPlayback={canControlPlayback}
                        handleAdminPlayTrack={handleAdminPlayTrack}
                        removeFromQueue={removeFromQueue}
                        addToQueue={addToQueue}
                        activeVideoId={
                          player.activeVideoId ?? playback?.videoId ?? null
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
                        onSearchClick={openSearchOverlay}
                        clearQueue={clearQueue}
                        user={user}
                        onLogout={() => {
                          logout();
                          router.push("/");
                        }}
                        onLeave={handleLeave}
                        roomCode={code}
                      />
                    </aside>
                  </div>
                </div>
              </div>
              {/*<RoomFooter />*/}
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
