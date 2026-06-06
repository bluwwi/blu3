"use client";
import { useRef, useCallback, useState } from "react";

const DEFAULT_BANDS: readonly number[] = [0.5, 0.5, 0.5, 0.5, 0.5];

export function useAudioAnalyzer() {
  const [isActive, setIsActive] = useState(false);
  const bandsRef = useRef<readonly number[]>(DEFAULT_BANDS);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef(0);
  const smoothRef = useRef<number[]>([0.5, 0.5, 0.5, 0.5, 0.5]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== "closed") {
      ctxRef.current.close();
    }
    ctxRef.current = null;
    setIsActive(false);
    bandsRef.current = DEFAULT_BANDS;
    smoothRef.current = [0.5, 0.5, 0.5, 0.5, 0.5];
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: false,
      });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const binSize = dataArray.length / 5;

      const read = () => {
        analyser.getByteFrequencyData(dataArray);
        const bands: number[] = [];
        for (let i = 0; i < 5; i++) {
          const start = Math.floor(i * binSize);
          const end = Math.floor((i + 1) * binSize);
          let sum = 0;
          for (let j = start; j < end; j++) sum += dataArray[j] || 0;
          const raw = end > start ? sum / (end - start) / 255 : 0;
          smoothRef.current[i] += (raw - smoothRef.current[i]) * 0.2;
          bands.push(smoothRef.current[i]);
        }
        bandsRef.current = bands;
        rafRef.current = requestAnimationFrame(read);
      };
      read();

      setIsActive(true);

      stream.addEventListener("inactive", stop);
    } catch {
    }
  }, [stop]);

  return { bandsRef, isActive, isSupported: true, start, stop };
}
