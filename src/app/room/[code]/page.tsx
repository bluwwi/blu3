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
import { SearchTab } from "@/components/Player/ui/SearchTab";
import { CDPlayer } from "@/components/Player/ui/Cdplayer";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
type RepeatMode = "off" | "all" | "one";

/* ─── helpers (unchanged) ─────────────────────────────────────────── */
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

/* ─── Design tokens ───────────────────────────────────────────────── */
const T = {
  bg: "#050508",
  surface: "#0D0D14",
  surface2: "#13131E",
  surface3: "#1A1A28",
  border: "rgba(106,90,205,0.18)",
  border2: "rgba(255,255,255,0.06)",
  purple: "#6A5ACD",
  purpleLight: "#8B7CE8",
  purpleDim: "#3D3280",
  purpleGhost: "rgba(106,90,205,0.12)",
  text: "#F0EFF8",
  text2: "#9B97B8",
  text3: "#4A4870",
  font: "'DM Mono', monospace",
};

/* ─── Page ────────────────────────────────────────────────────────── */
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
  const [leftTab, setLeftTab] = useState<"search" | "queue">("search");
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

  /* ─── Scheduling helpers (unchanged logic) ─────────────────────── */
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

  /* ─── Playback sync on join (unchanged) ────────────────────────── */
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

  /* ─── Queue advance (unchanged) ────────────────────────────────── */
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

  /* ─── Admin play (unchanged) ────────────────────────────────────── */
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

  /* ─── Silent audio context (unchanged) ─────────────────────────── */
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

  /* ─── Seek / play-pause / shuffle / repeat ──────────────────────── */
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

  /* ─── Lifecycle effects (unchanged) ────────────────────────────── */
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
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
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

  const handleLeave = () => {
    leaveRoom();
    router.replace("/browse");
  };
  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendChat(chatInput.trim());
    setChatInput("");
  };

  /* ─── Loading ───────────────────────────────────────────────────── */
  if (authLoading || !joined) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: T.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            color: T.text3,
            fontSize: "12px",
            fontFamily: T.font,
            letterSpacing: "0.2em",
            animation: "pulse 1.4s ease-in-out infinite",
          }}
        >
          joining room...
        </p>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
      </div>
    );
  }

  /* ─── Render ────────────────────────────────────────────────────── */
  return (
    <>
      <YouTubeIframe />
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          minHeight: "100vh",
          background: T.bg,
          color: T.text,
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gridTemplateRows: "56px 1fr",
          fontFamily: T.font,
          overflow: "hidden",
          height: "100vh",
        }}
      >
        {/* Top bar */}
        <div style={{ gridColumn: "1 / -1" }}>
          <RoomTopBar
            roomName={room?.name ?? "Room"}
            roomCode={code}
            isHost={isHost}
            connected={connected}
            track={footerTrack}
            activeVideoId={
              playerState.activeVideoId ?? playback?.videoId ?? null
            }
            playerState={footerPlayerState}
            onCopyInvite={() =>
              navigator.clipboard.writeText(window.location.href)
            }
            onLeave={handleLeave}
          />
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: T.bg,
          }}
        >
          {/* Tab bar */}
          <div
            style={{
              display: "flex",
              padding: "0 24px",
              borderBottom: `1px solid ${T.border}`,
              background: "rgba(13,13,20,0.6)",
              flexShrink: 0,
            }}
          >
            {(["search", "queue"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setLeftTab(tab)}
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  padding: "14px 0",
                  marginRight: "24px",
                  border: "none",
                  background: "none",
                  color: leftTab === tab ? T.text : T.text3,
                  cursor: "pointer",
                  position: "relative",
                  fontFamily: T.font,
                  transition: "color 0.15s",
                }}
              >
                {tab === "search" ? "⌕ Search & Discover" : `≡ Queue & History`}
                {tab === "queue" && (
                  <span
                    style={{
                      fontSize: "9px",
                      background: T.surface3,
                      color: T.text3,
                      padding: "1px 6px",
                      borderRadius: "20px",
                      marginLeft: "6px",
                    }}
                  >
                    {queue.length + recentTracks.length}
                  </span>
                )}
                {leftTab === tab && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: -1,
                      left: 0,
                      right: 0,
                      height: "2px",
                      background: T.purple,
                      borderRadius: "2px 2px 0 0",
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Scrollable content */}
          <div
            style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px" }}
            className="room-scroll"
          >
            {/* CD Player — always visible */}
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
              onCycleRepeat={canControlPlayback ? handleCycleRepeat : undefined}
              onSeek={canControlPlayback ? handleSeekAction : undefined}
            />

            {/* Tab content */}
            <div style={{ maxWidth: "560px", margin: "0 auto" }}>
              {leftTab === "search" && (
                <>
                  {!canControlPlayback ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        background: T.surface2,
                        border: `1px solid ${T.border}`,
                        borderRadius: "8px",
                        fontSize: "10px",
                        color: T.text3,
                        marginBottom: "14px",
                        letterSpacing: "0.05em",
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#22c55e",
                          animation: "pulse 1.5s ease-in-out infinite",
                          flexShrink: 0,
                          display: "inline-block",
                        }}
                      />
                      synced to host — music plays automatically
                    </div>
                  ) : !isHost ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        background: T.purpleGhost,
                        border: `1px solid rgba(106,90,205,0.25)`,
                        borderRadius: "8px",
                        fontSize: "10px",
                        color: T.purpleLight,
                        marginBottom: "14px",
                        letterSpacing: "0.05em",
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: T.purple,
                          animation: "pulse 1.5s ease-in-out infinite",
                          flexShrink: 0,
                          display: "inline-block",
                        }}
                      />
                      ⚡ Collaborative mode: host is away — you can control
                      playback!
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
                <div style={{ paddingTop: "8px" }}>
                  {/* Queue */}
                  <p
                    style={{
                      fontSize: "9px",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: T.text3,
                      paddingBottom: "8px",
                      borderBottom: `1px solid ${T.border}`,
                      marginBottom: "10px",
                    }}
                  >
                    Room Queue
                  </p>
                  {queue.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "32px 20px",
                        color: T.text3,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "28px",
                          marginBottom: "10px",
                          opacity: 0.4,
                        }}
                      >
                        ⊞
                      </div>
                      <p
                        style={{
                          fontSize: "10px",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                        }}
                      >
                        Queue is empty
                      </p>
                    </div>
                  ) : (
                    <div>
                      {queue.map((track, i) => (
                        <div
                          key={`${track.id}-${i}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "8px 10px",
                            borderRadius: "10px",
                            border: `1px solid ${T.border2}`,
                            background: T.surface,
                            marginBottom: "6px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              color: T.text3,
                              width: "14px",
                              textAlign: "right",
                              flexShrink: 0,
                            }}
                          >
                            {i + 1}
                          </span>
                          <img
                            src={track.image}
                            alt=""
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "8px",
                              objectFit: "cover",
                              flexShrink: 0,
                              background: T.surface3,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: "12px",
                                fontWeight: 500,
                                color: T.text,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {track.name}
                            </p>
                            <p
                              style={{
                                fontSize: "10px",
                                color: T.text2,
                                marginTop: "2px",
                              }}
                            >
                              {track.artists?.[0]?.name}
                            </p>
                          </div>
                          {canControlPlayback && (
                            <button
                              onClick={() => {
                                handleAdminPlayTrack(track);
                                removeFromQueue(track.id);
                              }}
                              style={{
                                fontSize: "9px",
                                color: T.purpleLight,
                                border: `1px solid rgba(106,90,205,0.3)`,
                                background: T.purpleGhost,
                                padding: "4px 10px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontFamily: T.font,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                              }}
                            >
                              Play
                            </button>
                          )}
                          <button
                            onClick={() => removeFromQueue(track.id)}
                            style={{
                              color: T.text3,
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "12px",
                              padding: "4px",
                              borderRadius: "6px",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* History */}
                  <p
                    style={{
                      fontSize: "9px",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: T.text3,
                      paddingBottom: "8px",
                      borderBottom: `1px solid ${T.border}`,
                      marginBottom: "10px",
                      marginTop: "24px",
                    }}
                  >
                    Room History{" "}
                    <span style={{ marginLeft: "8px", opacity: 0.5 }}>
                      {recentTracks.length} played
                    </span>
                  </p>
                  {recentTracks.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "32px 20px",
                        color: T.text3,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "28px",
                          marginBottom: "10px",
                          opacity: 0.4,
                        }}
                      >
                        🕘
                      </div>
                      <p
                        style={{
                          fontSize: "10px",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                        }}
                      >
                        No history yet
                      </p>
                    </div>
                  ) : (
                    <div>
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
                        const isActive =
                          playerState.nowPlaying?.videoId === track.videoId;
                        return (
                          <div
                            key={`${track.videoId}-${i}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "8px 10px",
                              borderRadius: "10px",
                              border: isActive
                                ? `1px solid rgba(106,90,205,0.3)`
                                : `1px solid ${T.border2}`,
                              background: isActive ? T.purpleGhost : T.surface,
                              marginBottom: "6px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "10px",
                                color: T.text3,
                                width: "14px",
                                textAlign: "right",
                                flexShrink: 0,
                              }}
                            >
                              {i + 1}
                            </span>
                            <img
                              src={track.image}
                              alt=""
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "8px",
                                objectFit: "cover",
                                flexShrink: 0,
                                background: T.surface3,
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  color: isActive ? T.purpleLight : T.text,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {track.trackName}
                              </p>
                              <p
                                style={{
                                  fontSize: "10px",
                                  color: T.text2,
                                  marginTop: "2px",
                                }}
                              >
                                {track.artistName}
                              </p>
                            </div>
                            {canControlPlayback && (
                              <button
                                onClick={() =>
                                  handleAdminPlayTrack(historyTrack)
                                }
                                style={{
                                  fontSize: "9px",
                                  color: T.purpleLight,
                                  border: `1px solid rgba(106,90,205,0.3)`,
                                  background: T.purpleGhost,
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontFamily: T.font,
                                  letterSpacing: "0.1em",
                                  textTransform: "uppercase",
                                }}
                              >
                                Play
                              </button>
                            )}
                            <button
                              onClick={() => addToQueue(historyTrack)}
                              style={{
                                width: "30px",
                                height: "30px",
                                borderRadius: "7px",
                                border: `1px solid ${T.border}`,
                                background: T.surface3,
                                color: T.text2,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "16px",
                                flexShrink: 0,
                              }}
                            >
                              ＋
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: members + chat */}
        <div
          style={{
            borderLeft: `1px solid ${T.border}`,
            display: "flex",
            flexDirection: "column",
            background: T.surface,
            overflow: "hidden",
          }}
        >
          {/* Members */}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: `1px solid ${T.border}`,
              flexShrink: 0,
            }}
          >
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
            {members.map((m) => (
              <div
                key={m.userId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                {m.avatar ? (
                  <img
                    src={m.avatar}
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      border: `1px solid ${T.border}`,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      background: T.purpleDim,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      color: T.purpleLight,
                      fontWeight: 500,
                      border: `1px solid rgba(106,90,205,0.3)`,
                      flexShrink: 0,
                    }}
                  >
                    {m.name[0]}
                  </div>
                )}
                <span style={{ fontSize: "11px", color: T.text2 }}>
                  {m.name.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>

          {/* Messages */}
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

          {/* Chat input */}
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
              placeholder="say something…"
              style={{
                flex: 1,
                background: T.surface3,
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
              onClick={handleSendChat}
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                border: "none",
                background: T.surface3,
                color: T.text2,
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
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .room-scroll::-webkit-scrollbar { width: 4px }
        .room-scroll::-webkit-scrollbar-track { background: transparent }
        .room-scroll::-webkit-scrollbar-thumb { background: ${T.surface3}; border-radius: 2px }
        input::placeholder { color: ${T.text3} !important }
      `}</style>
    </>
  );
}
