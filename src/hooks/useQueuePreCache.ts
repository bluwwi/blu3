"use client";
import { useEffect, useRef } from "react";
import type { Track } from "@/utils/types";
import { preResolveYt } from "@/utils/ytdl";

export function useQueuePreCache(queue: Track[], token?: string) {
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const seenRef = useRef(new Set<string>());
  const processingRef = useRef(false);
  const pendingRef = useRef<Track[]>([]);

  useEffect(() => {
    const newTracks = queue.filter((t) => t.videoId && !seenRef.current.has(t.videoId));
    for (const t of newTracks) seenRef.current.add(t.videoId);
    pendingRef.current.push(...newTracks);

    if (processingRef.current) return;

    processingRef.current = true;
    const processNext = async () => {
      while (pendingRef.current.length > 0) {
        const track = pendingRef.current.shift();
        if (!track?.videoId) continue;
        try {
          await preResolveYt(track.videoId, tokenRef.current);
        } catch {}
      }
      processingRef.current = false;
    };
    processNext();
  }, [queue]);
}
