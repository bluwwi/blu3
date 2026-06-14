"use client";
import { useRef, useEffect } from "react";
import * as Tone from "tone";
import { onVisibilityChange } from "@/utils/visibilityCoordinator";

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
  const smoothRef = useRef<number[]>([0.5, 0.5, 0.5, 0.5, 0.5]);
  const rafRef = useRef(0);
  const startedRef = useRef(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const cancellationRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const audio = audioRef.current;
    if (!audio) return;

    cancellationRef.current = false;

    const setup = async () => {
      if (startedRef.current) return;
      try {
        await Tone.start();
        const ctx = Tone.getContext().rawContext as AudioContext;
        ctxRef.current = ctx;

        const source = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        analyserRef.current = analyser;

        source.connect(analyser);
        analyser.connect(ctx.destination);

        startedRef.current = true;
      } catch {
        // Audio element already claimed by another context
      }
    };

    setup();

    return () => {
      cancellationRef.current = true;
    };
  }, [enabled, audioRef]);

  useEffect(() => {
    const dataArray = new Uint8Array(FFT_SIZE / 2);
    const binSize = (FFT_SIZE / 2) / NUM_BANDS;

    const readLoop = () => {
      if (cancellationRef.current) return;
      const analyser = analyserRef.current;
      if (!analyser) {
        rafRef.current = requestAnimationFrame(readLoop);
        return;
      }
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

    if (playing && startedRef.current) {
      readLoop();
    } else {
      bandsRef.current = DEFAULT_BANDS;
      smoothRef.current = [0.5, 0.5, 0.5, 0.5, 0.5];
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [playing]);

  useEffect(() => {
    const unsub = onVisibilityChange((visible) => {
      if (!visible) return;
      const ctx = ctxRef.current;
      if (ctx && ctx.state === "suspended") {
        ctx.resume();
      }
    });
    return unsub;
  }, []);

  return { bandsRef };
}
