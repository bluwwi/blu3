"use client";
import { useEffect, useRef } from "react";
import type { Track } from "@/utils/types";
import { preResolveYt } from "@/utils/ytdl";

export function useQueuePreCache(queue: Track[], token?: string) {
  const tokenRef = useRef(token);
  const seenRef = useRef(new Set<string>());
  const processingRef = useRef(false);
  const queueLenRef = useRef(0);

  tokenRef.current = token;

  useEffect(() => {
    if (queue.length === queueLenRef.current) return;
    queueLenRef.current = queue.length;

    const newTracks = queue.filter((t) => t.videoId && !seenRef.current.has(t.videoId));
    for (const t of newTracks) seenRef.current.add(t.videoId);

    if (newTracks.length === 0) return;

    const pending = [...newTracks];
    if (processingRef.current) return;

    processingRef.current = true;
    const processNext = async () => {
      while (pending.length > 0) {
        const track = pending.shift();
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
