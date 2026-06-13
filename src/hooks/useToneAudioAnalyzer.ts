"use client";
import { useRef, useEffect, useCallback } from "react";
import * as Tone from "tone";

const DEFAULT_BANDS: readonly number[] = [0.5, 0.5, 0.5, 0.5, 0.5];
const FFT_SIZE = 256;
const NUM_BANDS = 5;

interface UseToneAudioAnalyzerOptions {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  enabled?: boolean;
  playing?: boolean;
}

export function useToneAudioAnalyzer({ audioRef, enabled = true, playing = false }: UseToneAudioAnalyzerOptions) {
  const bandsRef = useRef<readonly number[]>(DEFAULT_BANDS);
  const sourceClaimedRef = useRef(false);
  const rafRef = useRef(0);
  const smoothRef = useRef<number[]>([0.5, 0.5, 0.5, 0.5, 0.5]);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    const ctx = ctxRef.current;
    if (ctx && ctx.state !== "closed") {
      ctx.close();
    }
    ctxRef.current = null;
    analyserRef.current = null;
    sourceClaimedRef.current = false;
    bandsRef.current = DEFAULT_BANDS;
    smoothRef.current = [0.5, 0.5, 0.5, 0.5, 0.5];
  }, []);

  useEffect(() => {
    if (!enabled || !playing) {
      cleanup();
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    let cancelled = false;

    const setup = async () => {
      if (sourceClaimedRef.current) {
        readLoop();
        return;
      }
      try {
        await Tone.start();
        const ctx = Tone.getContext().rawContext as AudioContext;
        ctxRef.current = ctx;

        const source = ctx.createMediaElementSource(audio);
        sourceClaimedRef.current = true;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        analyserRef.current = analyser;

        source.connect(analyser);
        analyser.connect(ctx.destination);

        readLoop();
      } catch {
        cleanup();
      }
    };

    const dataArray = new Uint8Array(FFT_SIZE / 2);
    const binSize = (FFT_SIZE / 2) / NUM_BANDS;

    const readLoop = () => {
      if (cancelled) return;
      const analyser = analyserRef.current;
      if (!analyser) return;
      analyser.getByteFrequencyData(dataArray);
      const bands: number[] = [];
      for (let i = 0; i < NUM_BANDS; i++) {
        const start = Math.floor(i * binSize);
        const end = Math.floor((i + 1) * binSize);
        let sum = 0;
        for (let j = start; j < end; j++) sum += dataArray[j] || 0;
        const raw = end > start ? sum / (end - start) / 255 : 0;
        smoothRef.current[i] += (raw - smoothRef.current[i]) * 0.2;
        bands.push(smoothRef.current[i]);
      }
      bandsRef.current = bands;
      rafRef.current = requestAnimationFrame(readLoop);
    };

    setup();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled, playing, audioRef, cleanup]);

  return { bandsRef };
}
