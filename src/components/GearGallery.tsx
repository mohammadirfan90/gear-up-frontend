"use client";

import { useState } from "react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/shared/utils/cn";
import { ImageWithFallback } from "@/components/ImageWithFallback";

interface GearGalleryProps {
  images: string[];
  name: string;
}

const FALLBACK_GRADIENTS = [
  "from-amber-300/40 via-rose-500/20 to-fuchsia-700/30",
  "from-cyan-300/40 via-sky-500/20 to-indigo-700/30",
  "from-emerald-300/40 via-teal-500/20 to-emerald-700/30",
  "from-orange-300/40 via-pink-500/20 to-purple-700/30",
];

export function GearGallery({ images, name }: GearGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasImages = images.length > 0;
  const fallbackIndex = activeIndex % FALLBACK_GRADIENTS.length;
  const fallback = FALLBACK_GRADIENTS[fallbackIndex];

  const handlePrev = () => {
    setActiveIndex((index) => (index - 1 + images.length) % Math.max(images.length, 1));
  };

  const handleNext = () => {
    setActiveIndex((index) => (index + 1) % Math.max(images.length, 1));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-card">
        {hasImages ? (
          <ImageWithFallback
            key={images[activeIndex]}
            src={images[activeIndex]}
            alt={name}
            fill
            priority
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover transition-opacity duration-500"
            fallbackClassName={cn("bg-gradient-to-br", fallback)}
            fallbackLabel="Image pending"
          />
        ) : (
          <div className={cn("absolute inset-0 bg-gradient-to-br", fallback)}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.18),transparent_60%)]" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
          </div>
        )}

        {hasImages && images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/80 text-foreground backdrop-blur transition-colors hover:bg-card"
            >
              <CaretLeftIcon weight="bold" className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/80 text-foreground backdrop-blur transition-colors hover:bg-card"
            >
              <CaretRightIcon weight="bold" className="h-4 w-4" />
            </button>
            <span className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card/80 px-2.5 py-1 text-[11px] text-foreground backdrop-blur">
              {activeIndex + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>

      {hasImages && images.length > 1 ? (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-md border transition-all",
                index === activeIndex
                  ? "border-emerald-500 shadow-glow"
                  : "border-border hover:border-emerald-500/40",
              )}
              aria-label={`Show image ${index + 1}`}
            >
              <ImageWithFallback
                src={image}
                alt={`${name} ${index + 1}`}
                fill
                sizes="120px"
                className="object-cover"
                fallbackLabel="—"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default GearGallery;
