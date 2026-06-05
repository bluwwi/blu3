"use client";
import { useEffect, useRef } from "react";
import YouTube, { YouTubeEvent } from "react-youtube";

interface YoutubePlayerProps {
  volume: number;
  onStateChange: (state: number) => void;
  onPlayerReady: (player: any) => void;
  onError?: () => void;
}

const PLACEHOLDER_ID = "dQw4w9WgXcQ";

export default function YoutubePlayer({
  volume,
  onStateChange,
  onPlayerReady,
  onError,
}: YoutubePlayerProps) {
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (playerRef.current) playerRef.current.setVolume(volume);
  }, [volume]);

  return (
    <div className="opacity-0 h-0 w-0 pointer-events-none absolute overflow-hidden">
      <YouTube
        videoId={PLACEHOLDER_ID}
        opts={{
          height: "0",
          width: "0",
          playerVars: {
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            autoplay: 0,
          },
        }}
        onReady={(e: YouTubeEvent) => {
          e.target.setVolume(volume);
          playerRef.current = e.target;
          onPlayerReady(e.target);
        }}
        onStateChange={(e: YouTubeEvent) => onStateChange(e.data)}
        onError={onError}
      />
    </div>
  );
}
