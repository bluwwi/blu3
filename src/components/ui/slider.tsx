"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  max?: number;
  min?: number;
  step?: number;
  className?: string;
  trackClassName?: string;
  rangeClassName?: string;
  thumbClassName?: string;
}

export function Slider({
  value,
  onValueChange,
  max = 100,
  min = 0,
  step = 1,
  className = "",
  trackClassName = "",
  rangeClassName = "",
  thumbClassName = "",
}: SliderProps) {
  return (
    <SliderPrimitive.Root
      className={`relative flex w-full group touch-none select-none items-center ${className}`}
      value={[value]}
      onValueChange={([v]) => onValueChange(v)}
      max={max}
      min={min}
      step={step}
    >
      <SliderPrimitive.Track
        className={`relative h-1 w-full grow overflow-hidden rounded-full ${trackClassName}`}
      >
        <SliderPrimitive.Range
          className={`absolute h-full ${rangeClassName}`}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={`block h-3 w-3 rounded-full shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${thumbClassName}`}
      />
    </SliderPrimitive.Root>
  );
}
