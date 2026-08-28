"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { cn } from "@/shared/utils/cn";

export interface HeroSlide {
  src: string;
  alt: string;
  caption?: string;
}

interface HeroImageSliderProps {
  slides: HeroSlide[];
  interval?: number;
  className?: string;
}

const AUTOPLAY_INTERVAL = 6000;

export function HeroImageSlider({
  slides,
  interval = AUTOPLAY_INTERVAL,
  className,
}: HeroImageSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = slides.length;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback(
    (index: number) => {
      if (total === 0) return;
      const next = ((index % total) + total) % total;
      setActiveIndex(next);
    },
    [total],
  );

  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const prev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    if (isPaused || total <= 1) return;
    timerRef.current = setTimeout(() => {
      setActiveIndex((current) => (current + 1) % total);
    }, interval);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeIndex, interval, isPaused, total]);

  if (total === 0) return null;

  const activeSlide = slides[activeIndex];

  return (
    <div
      className={cn(
        "group/slider absolute inset-0 overflow-hidden",
        className,
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label="Hero image slideshow"
    >
      {slides.map((slide, index) => {
        const isActive = index === activeIndex;
        const style: CSSProperties = {
          opacity: isActive ? 1 : 0,
          transition: "opacity 1200ms ease-in-out",
          willChange: "opacity",
        };
        return (
          <div
            key={slide.src}
            className="absolute inset-0"
            style={style}
            aria-hidden={!isActive}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${total}`}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              className="h-full w-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
              draggable={false}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-teal-700/[0.18] mix-blend-overlay"
            />
          </div>
        );
      })}

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/90 backdrop-blur-md opacity-0 transition-all hover:border-emerald-400/50 hover:bg-black/50 hover:text-white focus-visible:opacity-100 group-hover/slider:opacity-100 sm:left-6"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/90 backdrop-blur-md opacity-0 transition-all hover:border-emerald-400/50 hover:bg-black/50 hover:text-white focus-visible:opacity-100 group-hover/slider:opacity-100 sm:right-6"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>

          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 sm:bottom-8">
            {slides.map((slide, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={`dot-${slide.src}`}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={isActive}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    isActive
                      ? "w-8 bg-emerald-400 shadow-[0_0_18px_4px_rgba(16,185,129,0.5)]"
                      : "w-3 bg-white/40 hover:bg-white/70",
                  )}
                />
              );
            })}
          </div>

          {activeSlide.caption ? (
            <div
              key={`caption-${activeIndex}`}
              className="pointer-events-none absolute bottom-20 left-1/2 z-10 -translate-x-1/2 px-4 text-center text-xs uppercase tracking-[0.3em] text-white/60 sm:bottom-24"
              style={{ animation: "fade-in-up 700ms ease-out 200ms both" }}
            >
              {activeSlide.caption}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export default HeroImageSlider;