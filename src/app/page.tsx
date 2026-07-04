"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { Track } from "@/utils/types";
import { SearchOverlay } from "@/components/Player/ui/SearchOverlay";
import { RoomStars } from "@/components/Player/ui/RoomStars";
import { VideoBackground } from "@/components/Player/ui/VideoBackground";
import { MusicNotesIcon, StarIcon } from "@phosphor-icons/react";
import Link from "next/link";

const DEMO_TRACKS: Track[] = [
  {
    id: "demo-1",
    source: "youtube",
    videoId: "d1",
    name: "Sunflower",
    duration_ms: 210000,
    explicit: false,
    artists: [{ name: "Post Malone & Swae Lee" }],
    album: { name: "Spider-Man: Into the Spider-Verse" },
    image: "/queue/sunflower.jpg",
  },
  {
    id: "demo-2",
    source: "youtube",
    videoId: "d2",
    name: "Blu3 Dreams",
    duration_ms: 240000,
    explicit: false,
    artists: [{ name: "Luna Ray" }],
    album: { name: "Night Visions" },
    image: "/queue/cat.jpg",
  },
  {
    id: "demo-3",
    source: "youtube",
    videoId: "d3",
    name: "Midnight City",
    duration_ms: 260000,
    explicit: false,
    artists: [{ name: "M83" }],
    album: { name: "Hurry Up, We're Dreaming" },
    image: "/queue/camera.jpg",
  },
  {
    id: "demo-4",
    source: "youtube",
    videoId: "d4",
    name: "Vibes",
    duration_ms: 200000,
    explicit: false,
    artists: [{ name: "Kyle Dixon" }],
    album: { name: "Stranger Things" },
    image: "/queue/vibe.jpg",
  },
  {
    id: "demo-5",
    source: "youtube",
    videoId: "d5",
    name: "Rose Gold",
    duration_ms: 230000,
    explicit: false,
    artists: [{ name: "The Blaze" }],
    album: { name: "Dancehall" },
    image: "/queue/rose.jpg",
  },
];

const DEMO_MEMBERS = [
  { userId: "1", name: "Alice", avatar: "/queue/cat.jpg" },
  { userId: "2", name: "Bob" },
  { userId: "3", name: "Charlie", avatar: "/queue/sunflower.jpg" },
];

const DEMO_MESSAGES = [
  { id: "m1", name: "Alice", text: "Hey everyone!" },
  { id: "m2", name: "Bob", text: "Love this track" },
  { id: "m3", name: "Charlie", text: "What's next?" },
  { id: "m4", name: "Alice", text: "How about some lo-fi?" },
];

function getDemoRecent() {
  const now = Date.now();
  return [
    {
      videoId: "r1",
      trackName: "Heartbeat",
      artistName: "TheXX",
      image: "/queue/heart.jpg",
      playedAt: now - 300000,
    },
    {
      videoId: "r2",
      trackName: "Redbone",
      artistName: "Childish Gambino",
      image: "/queue/red.jpg",
      playedAt: now - 600000,
    },
    {
      videoId: "r3",
      trackName: "Hiatus",
      artistName: "Tycho",
      image: "/queue/hi.jpg",
      playedAt: now - 900000,
    },
  ];
}

type PlayerState =
  "idle" | "loading" | "playing" | "paused" | "ended" | "error";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/browse");
    }
  }, [user, loading, router]);

  const [queue, setQueue] = useState<Track[]>(DEMO_TRACKS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playerState, setPlayerState] = useState<PlayerState>("playing");
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const [starsMounted, setStarsMounted] = useState(false);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    setStarsMounted(true);
  }, []);

  const currentTrack = queue[currentIndex];

  useEffect(() => {
    if (playerState !== "playing") return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const dur = currentTrack?.duration_ms
          ? currentTrack.duration_ms / 1000
          : 240;
        if (prev >= dur - 1) return 0;
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [playerState, currentTrack?.duration_ms]);

  const duration = currentTrack?.duration_ms
    ? currentTrack.duration_ms / 1000
    : 240;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handlePlayPause = useCallback(() => {
    setPlayerState((prev) => (prev === "playing" ? "paused" : "playing"));
  }, []);

  const handleSkipForward = useCallback(() => {
    setCurrentIndex((prev) => {
      if (shuffleEnabled) {
        return Math.floor(Math.random() * DEMO_TRACKS.length);
      }
      return (prev + 1) % DEMO_TRACKS.length;
    });
    setCurrentTime(0);
    setPlayerState("playing");
  }, [shuffleEnabled]);

  const handleSkipBack = useCallback(() => {
    if (currentTime > 3) {
      setCurrentTime(0);
      return;
    }
    setCurrentIndex((prev) => {
      if (prev === 0) return DEMO_TRACKS.length - 1;
      return prev - 1;
    });
    setCurrentTime(0);
    setPlayerState("playing");
  }, [currentTime]);

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleVolume = useCallback(
    (val: number) => {
      setVolume(val);
      if (isMuted) setIsMuted(false);
    },
    [isMuted],
  );

  const handleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const handleToggleLike = useCallback(() => {
    setIsLiked((prev) => !prev);
  }, []);

  const handleToggleShuffle = useCallback(() => {
    setShuffleEnabled((prev) => !prev);
  }, []);

  const handleCycleRepeat = useCallback(() => {
    setRepeatMode((prev) =>
      prev === "off" ? "all" : prev === "all" ? "one" : "off",
    );
  }, []);

  const handleRemoveFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleAddToQueue = useCallback((track: Track) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const handleClearQueue = useCallback(() => {
    setQueue(DEMO_TRACKS);
  }, []);

  const handleAdminPlayTrack = useCallback(
    (track: Track) => {
      const idx = queue.findIndex((t) => t.id === track.id);
      if (idx >= 0) setCurrentIndex(idx);
      setCurrentTime(0);
      setPlayerState("playing");
    },
    [queue],
  );

  const handleSendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    setChatInput("");
  }, [chatInput]);

  const popularGenres = [
    "Pop hits",
    "Hip hop",
    "Lo-fi",
    "Rock classics",
    "Bollywood",
    "EDM",
  ];

  return (
    <div className="relative min-h-dvh safe-area-top safe-area-bottom">
      <div className="transition-opacity duration-500 opacity-100 pointer-events-auto">
        <div className="w-full h-full bg-[#334EAC] relative">
          <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <VideoBackground />
            {/*<WaveBackground overlay={false} />*/}
          </div>

          {starsMounted && <RoomStars />}

          <div className="relative z-10 gap-2 sm:h-dvh items-center justify-center flex flex-col h-full w-full overflow-hidden">
            <div
              className="mx-auto flex sm:border border-white/10 h-full sm:h-fit flex-col pb-0 px-0 sm:rounded-3xl
              w-[55%] max-2xl:w-[75%] max-xl:w-[85%] max-lg:w-[92%] max-sm:w-full
              filter shadow-[0_0_40px_rgba(0,0,0,0.6)]
              sm:filter sm:shadow-[0_0_60px_rgba(0,0,0,0.5)]"
            >
              <div className="flex h-full mt-0 gap-0 sm:gap-2 pt-0 min-h-0">
                <div className="relative w-full h-full flex flex-col lg:flex-row min-h-0 flex-1  gap-0 sm:gap-3 pb-0 lg:pb-0">
                  <aside
                    className="
                    w-full lg:w-[50%] h-fit lg:h-full shrink-0 sm:min-h-125  lg:min-h-0
                    max-sm:rounded-none sm:rounded-3xl
                    max-sm:border-0 sm:border sm:border-white/10
                    bg-white/5
                    backdrop-blur-2xl
                    filter drop-shadow-[0_0_40px_rgba(0,0,0,1)]
                    sm:filter sm:drop-shadow-[0_0_60px_rgba(0,0,0,1)]
                    overflow-visible
                    relative transition-all duration-300
                    max-sm:before:hidden sm:before:absolute sm:before:inset-0 sm:before:rounded-3xl sm:before:pointer-events-none sm:before:bg-linear-to-b sm:before:from-white/4 sm:before:to-transparent"
                  >
                    <div className="flex gap-5 md:gap-10  px-6 pt-16 py-8 md:py-8 flex-col h-full w-full justify-evenly items-center sm:items-start">
                      <img
                        src={"/logo/tvlogo.svg"}
                        alt={"gif"}
                        className="w-26 md:w-20 h-fit mx-auto sm:mx-0"
                      />
                      <div className="flex flex-col gap-3 text-center sm:text-left">
                        <div className="text-4xl font-bold sm:text-5xl text-white">
                          Listen Together <br /> Feel Together
                          <StarIcon
                            className="inline-block -mt-1"
                            weight="fill"
                            size={32}
                          />
                        </div>
                        <div className="text-sm sm:text-xl text-white font-normal">
                          Invite friends, stream together, and enjoy millions of
                          songs in perfect sync.🥂
                        </div>
                      </div>
                      <div className="flex flex-col w-full gap-2.5">
                        <Link
                          href="/login"
                          className="px-4 hover:bg-purple-600 hover:text-white  transition-all duration-300 py-1.5 flex items-center gap-2 text-black bg-white rounded-lg text-md md:text-lg  w-full sm:w-fit justify-center"
                        >
                          Get Started
                          <MusicNotesIcon className="inline-block" size={22} />
                        </Link>
                        <Link
                          href="/login"
                          className="text-xs sm:text-sm underline underline-offset-4 text-white/80 font-normal hover:text-white transition-all duration-300 text-center sm:text-left"
                        >
                          Already logged in?
                        </Link>
                      </div>

                      <hr className="border-t border-white/50 text-white/80 my-3 md:my-0 w-full" />
                      <div className="flex flex-wrap justify-center  sm:justify-between w-full text-sm sm:text-lg font-normal gap-8">
                        <div className="flex gap-2 text-sm sm:text-lg font-normal items-center flex-wrap justify-center sm:justify-start">
                          <Link
                            href={"/terms"}
                            className="underline underline-offset-4 hover:text-white transition-all duration-300"
                          >
                            Terms
                          </Link>
                          <span className="text-white/40">|</span>
                          <Link
                            href={"/privacy"}
                            className="underline underline-offset-4 hover:text-white transition-all duration-300"
                          >
                            Privacy
                          </Link>
                          <span className="text-white/40">|</span>
                          <a
                            href="https://github.com/xrealblue"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-4 hover:text-white transition-all duration-300"
                          >
                            Github
                          </a>
                        </div>

                        <div className="flex gap-2 items-center">
                          <a
                            href="https://x.com/realbluex"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:scale-110 transition-all duration-300 text-white/80 hover:text-white"
                          >
                            <XLogoIcon size={22} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </aside>

                  <aside
                    className="
                    flex-1 min-w-0 w-full lg:w-[50%] h-full lg:h-full shrink-0 min-h-95 sm:min-h-0 lg:min-h-0
                    max-sm:rounded-none sm:rounded-3xl
                    max-sm:border-0 sm:border-2 sm:border-white/8
                    bg-white/5
                    backdrop-blur-2xl
                    filter drop-shadow-[0_0_40px_rgba(0,0,0,1)]
                    sm:filter sm:drop-shadow-[0_0_60px_rgba(0,0,0,0.6)]
                    overflow-visible
                    transition-all duration-300
                    max-sm:before:hidden sm:before:absolute sm:before:inset-0 sm:before:rounded-3xl sm:before:pointer-events-none sm:before:bg-gradient-to-b sm:before:from-white/[0.04] sm:before:to-transparent
                    flex flex-col"
                  >
                    <img
                      src={"/listen.gif"}
                      alt={"gif"}
                      className="w-full px-4 md:p-0 rounded-3xl h-full object-cover "
                    />
                  </aside>
                </div>
              </div>
            </div>
          </div>

          <SearchOverlay
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
            searchQuery=""
            suggestions={[]}
            showSuggestions={false}
            results={[]}
            isSearching={false}
            searchError=""
            recentTracks={queue}
            activeTrackId={currentTrack?.id ?? null}
            loadingTrackId={null}
            isPlaying={playerState === "playing"}
            onSearchInput={() => {}}
            onSearch={() => {}}
            onSuggestionSelect={() => {}}
            onTrackSelect={(track) => {
              const idx = queue.findIndex((t) => t.id === track.id);
              if (idx >= 0) setCurrentIndex(idx);
              setCurrentTime(0);
              setPlayerState("playing");
            }}
            onAddToQueue={handleAddToQueue}
            avatarUrl={undefined}
            avatarLabel="You"
            popularGenres={popularGenres}
          />
        </div>
      </div>
    </div>
  );
}
