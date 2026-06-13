"use client";
import { useRef, useEffect, useCallback } from "react";
import * as Tone from "tone";

const DEFAULT_BANDS: readonly number[] = [0.5, 0.5, 0.5, 0.5, 0.5];
const FFT_SIZE = 256;
const NUM_BANDS = 5;

interface UseToneAudioAnalyzerOptions {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  enabled?: boolean;
}

export function useToneAudioAnalyzer({ audioRef, enabled = true }: UseToneAudioAnalyzerOptions) {
  const bandsRef = useRef<readonly number[]>(DEFAULT_BANDS);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef(0);
  const smoothRef = useRef<number[]>([0.5, 0.5, 0.5, 0.5, 0.5]);
  const startedRef = useRef(false);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    analyserRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== "closed") {
      ctxRef.current.close();
    }
    ctxRef.current = null;
    startedRef.current = false;
    bandsRef.current = DEFAULT_BANDS;
    smoothRef.current = [0.5, 0.5, 0.5, 0.5, 0.5];
  }, []);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    let cancelled = false;

    const setup = async () => {
      try {
        if (startedRef.current) cleanup();
        if (cancelled) return;

        const ctx = new AudioContext();
        ctxRef.current = ctx;

        const source = ctx.createMediaElementSource(audio);
        sourceRef.current = source;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        analyserRef.current = analyser;

        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const binSize = dataArray.length / NUM_BANDS;

        const read = () => {
          if (cancelled) return;
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
          rafRef.current = requestAnimationFrame(read);
        };

        startedRef.current = true;
        read();
      } catch {
        // MediaElementAudioSourceNode can only be created once per element.
        // If this fails, the element was already claimed by another context.
      }
    };

    setup();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [audioRef.current, enabled, cleanup]);

  return { bandsRef };
}
