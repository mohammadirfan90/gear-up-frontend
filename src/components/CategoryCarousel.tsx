"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BicycleIcon,
  MountainsIcon,
  TentIcon,
  PersonSimpleSwimIcon,
  SunIcon,
  SnowflakeIcon,
  CompassIcon,
  PathIcon,
  SparkleIcon,
  AnchorIcon,
  BoatIcon,
  FishSimpleIcon,
  FootprintsIcon,
  HorseIcon,
  PersonSimpleSkiIcon,
  TennisBallIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react/dist/lib/types";
import { cn } from "@/shared/utils/cn";
import type { Category } from "@/shared/categories";

interface CategoryCarouselProps {
  categories: Category[];
}

const FALLBACK_CATEGORIES: Category[] = [
  {
    id: "cycling",
    name: "Cycling",
    slug: "cycling",
    description: "Bikes, gravel rigs, and everything to chase the horizon.",
  },
  {
    id: "camping",
    name: "Camping",
    slug: "camping",
    description: "Tents, sleep systems, and basecamp essentials.",
  },
  {
    id: "water-sports",
    name: "Water Sports",
    slug: "water-sports",
    description: "Kayaks, SUPs, and gear for the open water.",
  },
  {
    id: "climbing",
    name: "Climbing",
    slug: "climbing",
    description: "Ropes, harnesses, and the tools to find your line.",
  },
  {
    id: "hiking",
    name: "Hiking",
    slug: "hiking",
    description: "Backpacks, trekking poles, and trail-tested kit.",
  },
  {
    id: "winter-sports",
    name: "Winter Sports",
    slug: "winter-sports",
    description: "Skis, snowboards, and gear for cold pursuits.",
  },
  {
    id: "surfing",
    name: "Surfing",
    slug: "surfing",
    description: "Boards, wetsuits, and accessories.",
  },
  {
    id: "fishing",
    name: "Fishing",
    slug: "fishing",
    description: "Rods, reels, and quiet mornings by the water.",
  },
];

const slugIconMap: Record<string, Icon> = {
  cycling: BicycleIcon,
  camping: TentIcon,
  "water-sports": PersonSimpleSwimIcon,
  climbing: MountainsIcon,
  hiking: PathIcon,
  hiking1: FootprintsIcon,
  "winter-sports": PersonSimpleSkiIcon,
  surfing: AnchorIcon,
  fishing: FishSimpleIcon,
  snow: SnowflakeIcon,
  trail: PathIcon,
  tennis: TennisBallIcon,
  horse: HorseIcon,
  default: CompassIcon,
};

const resolveIcon = (slug: string, name: string): Icon => {
  if (slugIconMap[slug]) return slugIconMap[slug];
  const normalized = name.toLowerCase();
  if (normalized.includes("bike") || normalized.includes("cycle"))
    return BicycleIcon;
  if (normalized.includes("camp") || normalized.includes("tent"))
    return TentIcon;
  if (normalized.includes("snow") || normalized.includes("ski"))
    return SnowflakeIcon;
  if (normalized.includes("climb") || normalized.includes("mountain"))
    return MountainsIcon;
  if (normalized.includes("hik") || normalized.includes("trail"))
    return FootprintsIcon;
  if (normalized.includes("water") || normalized.includes("kayak") || normalized.includes("sup"))
    return BoatIcon;
  if (normalized.includes("surf")) return AnchorIcon;
  if (normalized.includes("fish")) return FishSimpleIcon;
  if (normalized.includes("summer") || normalized.includes("sun")) return SunIcon;
  return slugIconMap.default;
};

const GRADIENTS = [
  "from-emerald-300/30 via-teal-500/15 to-emerald-700/20",
  "from-amber-300/30 via-orange-500/15 to-rose-700/20",
  "from-sky-300/30 via-blue-500/15 to-indigo-700/20",
  "from-fuchsia-300/30 via-purple-500/15 to-pink-700/20",
  "from-emerald-300/30 via-teal-500/15 to-cyan-700/20",
  "from-rose-300/30 via-pink-500/15 to-fuchsia-700/20",
];

const gradientFor = (index: number) =>
  GRADIENTS[index % GRADIENTS.length];

export function CategoryCarousel({ categories }: CategoryCarouselProps) {
  const data = categories.length > 0 ? categories : FALLBACK_CATEGORIES;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [showPrev, setShowPrev] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const { scrollLeft, scrollWidth, clientWidth } = node;
    setShowPrev(scrollLeft > 8);
    setShowNext(scrollLeft + clientWidth < scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateScrollState();
    const node = scrollerRef.current;
    if (!node) return;
    node.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      node.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scrollBy = (direction: "prev" | "next") => {
    const node = scrollerRef.current;
    if (!node) return;
    const offset = node.clientWidth * 0.75;
    node.scrollBy({
      left: direction === "next" ? offset : -offset,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className={cn(
          "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1",
          "scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none]",
          "[&::-webkit-scrollbar]:hidden",
        )}
      >
        {data.map((category, index) => {
          const Icon = resolveIcon(category.slug, category.name);
          const gradient = gradientFor(index);
          return (
            <Link
              key={category.id}
              href={`/gear?category=${encodeURIComponent(category.slug)}`}
              className="group relative flex min-h-[180px] w-[260px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-glow sm:w-[280px]"
            >
              <div
                aria-hidden
                className={cn(
                  "absolute inset-0 -z-0 bg-gradient-to-br opacity-30 transition-opacity group-hover:opacity-50 dark:opacity-50 dark:group-hover:opacity-80",
                  gradient,
                )}
              />
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1/2 dark:bg-gradient-to-t dark:from-black/60 dark:to-transparent"
              />
              <div
                aria-hidden
                className="absolute right-4 top-4 h-24 w-24 rounded-full bg-emerald-500/[0.04] blur-2xl transition-colors group-hover:bg-emerald-500/10 dark:bg-white/[0.04] dark:group-hover:bg-emerald-400/10"
              />

              <div className="relative z-10 flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 backdrop-blur dark:border-white/10 dark:bg-black/40 dark:text-emerald-400">
                  <Icon weight="duotone" className="h-4 w-4" />
                </span>
                <ArrowRightIcon
                  weight="bold"
                  className="h-3.5 w-3.5 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-foreground"
                />
              </div>

              <div className="relative z-10">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {category.name}
                </h3>
                {category.description ? (
                  <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                    {category.description}
                  </p>
                ) : null}
                <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 opacity-0 transition-opacity group-hover:opacity-100">
                  <SparkleIcon weight="fill" className="h-3 w-3" />
                  Explore
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-background to-transparent transition-opacity",
          showPrev ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background to-transparent transition-opacity",
          showNext ? "opacity-100" : "opacity-0",
        )}
      />

      <button
        type="button"
        onClick={() => scrollBy("prev")}
        disabled={!showPrev}
        aria-label="Scroll categories left"
        className={cn(
          "absolute left-0 top-1/2 z-20 inline-flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-elevated transition-all hover:bg-secondary",
          showPrev ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <ArrowLeftIcon weight="bold" className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => scrollBy("next")}
        disabled={!showNext}
        aria-label="Scroll categories right"
        className={cn(
          "absolute right-0 top-1/2 z-20 inline-flex h-9 w-9 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-elevated transition-all hover:bg-secondary",
          showNext ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <ArrowRightIcon weight="bold" className="h-4 w-4" />
      </button>
    </div>
  );
}

export default CategoryCarousel;
