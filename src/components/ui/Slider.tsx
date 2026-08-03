"use client";

import { useId } from "react";
import { cn } from "@/shared/utils/cn";

interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  className?: string;
}

export function Slider({
  min,
  max,
  step = 1,
  value,
  onValueChange,
  className,
}: SliderProps) {
  const baseId = useId();
  const [left, right] = value;
  const range = Math.max(1, max - min);
  const leftPercent = Math.max(0, Math.min(100, ((left - min) / range) * 100));
  const rightPercent = Math.max(0, Math.min(100, ((right - min) / range) * 100));

  const handleChange = (index: 0 | 1) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    if (Number.isNaN(next)) return;
    if (index === 0) {
      onValueChange([Math.min(next, right), right]);
    } else {
      onValueChange([left, Math.max(next, left)]);
    }
  };

  return (
    <div className={cn("relative h-6 w-full", className)}>
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-secondary" />
      <div
        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-lime-400 to-lime-300"
        style={{ left: `${leftPercent}%`, right: `${100 - rightPercent}%` }}
      />
      <input
        id={`${baseId}-min`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={left}
        onChange={handleChange(0)}
        className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-lime-400 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:shadow-glow [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-lime-400 [&::-moz-range-thumb]:bg-black"
      />
      <input
        id={`${baseId}-max`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={right}
        onChange={handleChange(1)}
        className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-lime-400 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:shadow-glow [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-lime-400 [&::-moz-range-thumb]:bg-black"
      />
    </div>
  );
}

export default Slider;
