"use client";

import ReactPlayer from "react-player";

interface Props {
  src: string | null;
  playing: boolean;
  volume: number;
  muted: boolean;
  playerRef: React.MutableRefObject<ReactPlayer | null>;
  onReady: () => void;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onError: (e: any) => void;
}

export function ReactPlayerWrapper({
  src,
  playing,
  volume,
  muted,
  playerRef,
  onReady,
  onPlay,
  onPause,
  onEnded,
  onError,
}: Props) {
  return (
    <div
      style={{
        position: "absolute",
        opacity: 0,
        zIndex: -10,
        width: 10,
        height: 10,
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      <ReactPlayer
        ref={playerRef}
        url={src ?? undefined}
        playing={playing}
        volume={volume}
        muted={muted}
        width={10}
        height={10}
        onReady={onReady}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onError={onError}
        config={{
          youtube: {
            playerVars: {
              controls: 0,
              disablekb: 1,
              modestbranding: 1,
              rel: 0,
            },
          },
        }}
      />
    </div>
  );
}
