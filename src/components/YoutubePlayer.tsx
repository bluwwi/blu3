"use client";
import { useEffect, useRef, useCallback } from "react";
import YouTube, { YouTubeEvent } from "react-youtube";

interface YoutubePlayerProps {
  videoId: string | null;
  volume: number;
  onStateChange: (state: number) => void;
  onPlayerReady: (player: any) => void;
}

export default function YoutubePlayer({
  videoId,
  volume,
  onStateChange,
  onPlayerReady,
}: YoutubePlayerProps) {
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  const handleReady = useCallback(
    (e: YouTubeEvent) => {
      playerRef.current = e.target;
      e.target.setVolume(volume);
      onPlayerReady(e.target);
    },
    [volume, onPlayerReady],
  );

  if (!videoId) return null;

  return (
    <div className="opacity-0 h-0 w-0 pointer-events-none absolute overflow-hidden">
      <YouTube
        videoId={videoId}
        opts={{
          height: "0",
          width: "0",
          playerVars: {
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            autoplay: 1,
          },
        }}
        onReady={handleReady}
        onStateChange={(e: YouTubeEvent) => onStateChange(e.data)}
      />
    </div>
  );
}
