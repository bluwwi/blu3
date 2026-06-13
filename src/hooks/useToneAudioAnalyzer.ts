"use client";
import { useRef, useEffect, useCallback, useState } from "react";
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
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef(0);
  const smoothRef = useRef<number[]>([0.5, 0.5, 0.5, 0.5, 0.5]);
  const sourceClaimedRef = useRef(false);
  const mountedRef = useRef(true);

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
    sourceClaimedRef.current = false;
    bandsRef.current = DEFAULT_BANDS;
    smoothRef.current = [0.5, 0.5, 0.5, 0.5, 0.5];
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    if (!playing) return;

    const audio = audioRef.current;
    if (!audio) return;

    let cancelled = false;

    const setup = () => {
      if (sourceClaimedRef.current) {
        readLoop();
        return;
      }
      try {
        const ctx = new AudioContext();
        ctxRef.current = ctx;

        const source = ctx.createMediaElementSource(audio);
        sourceRef.current = source;
        sourceClaimedRef.current = true;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        analyserRef.current = analyser;

        source.connect(analyser);

        startedRef.current = true;
        readLoop();
      } catch {
        // MediaElementAudioSourceNode already claimed
      }
    };

    const dataArray = new Uint8Array(FFT_SIZE / 2);
    const binSize = (FFT_SIZE / 2) / NUM_BANDS;

    const readLoop = () => {
      if (cancelled || !mountedRef.current) return;
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
  }, [enabled, playing, cleanup]);

  return { bandsRef };
}
