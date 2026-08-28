import Link from "next/link";
import ImageWithFallback from "@/components/ImageWithFallback";
import { StarIcon, ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/shared/utils/cn";
import type { GearSummary } from "@/shared/gear";

interface GearCardProps {
  gear: GearSummary;
  className?: string;
}

const FALLBACK_GRADIENTS: Record<string, string> = {
  "1": "from-amber-300/40 via-rose-500/30 to-fuchsia-700/30",
  "2": "from-cyan-400/30 via-sky-500/30 to-indigo-700/30",
  "3": "from-emerald-300/40 via-teal-500/30 to-emerald-700/30",
  "4": "from-orange-300/40 via-pink-500/30 to-purple-700/30",
};

const formatPrice = (price: number | string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(price || 0));

export function GearCard({ gear, className }: GearCardProps) {
  const cover = gear.images?.[0];
  const fallback = FALLBACK_GRADIENTS[String(gear.id).charAt(0)] ?? FALLBACK_GRADIENTS["1"];

  return (
    <Link
      href={`/gear/${gear.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-glow",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <ImageWithFallback
          src={cover}
          alt={gear.name}
          fill
          sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          fallbackClassName={cn("bg-gradient-to-br", fallback)}
          fallbackLabel="No image"
        />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-black/60 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
          <ShieldCheckIcon weight="duotone" className="h-3 w-3 text-emerald-400" />
          {gear.isAvailable ? "Available" : "Unavailable"}
        </div>
        <div className="absolute right-3 top-3 rounded-md border border-white/10 bg-black/60 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
          {gear.category.name}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-[15px] font-semibold text-foreground">
            {gear.name}
          </h3>
          <div className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
            <StarIcon weight="fill" className="h-3 w-3 text-amber-300" />
            New
          </div>
        </div>
        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {gear.description}
        </p>
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              From
            </p>
            <p className="text-lg font-semibold text-foreground">
              {formatPrice(gear.pricePerDay)}
              <span className="ml-1 text-[12px] font-medium text-muted-foreground">
                / day
              </span>
            </p>
          </div>
          <span className="rounded-md border border-border bg-secondary/50 px-2 py-1 text-[11px] text-muted-foreground">
            {gear.brand}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default GearCard;
