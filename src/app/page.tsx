import Link from "next/link";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
  CompassIcon,
  LightningIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparkleIcon,
  TimerIcon,
  TrendUpIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import { GearCard } from "@/components/GearCard";
import { HeroSearch } from "@/components/HeroSearch";
import { fetchFeaturedGear, type GearSummary } from "@/shared/gear";

const fallbackGear: GearSummary[] = [
  {
    id: "demo-trail-bike",
    name: "Apex Trail Bike",
    brand: "Canyon",
    description: "Full-suspension precision for fast descents and technical climbs.",
    pricePerDay: 48,
    stock: 5,
    isAvailable: true,
    images: [],
    category: { id: "trail", name: "Cycling", slug: "cycling" },
    provider: { id: "gearup", name: "GearUp Select" },
  },
  {
    id: "demo-alpine-tent",
    name: "Alpine Basecamp 4P",
    brand: "North Face",
    description: "A weatherproof basecamp with room to stretch out after a big day.",
    pricePerDay: 32,
    stock: 8,
    isAvailable: true,
    images: [],
    category: { id: "camp", name: "Camping", slug: "camping" },
    provider: { id: "gearup", name: "GearUp Select" },
  },
  {
    id: "demo-touring-kayak",
    name: "Rogue Touring Kayak",
    brand: "Wilderness",
    description: "Stable, responsive and ready for your next weekend on the water.",
    pricePerDay: 55,
    stock: 3,
    isAvailable: true,
    images: [],
    category: { id: "water", name: "Water Sports", slug: "water-sports" },
    provider: { id: "gearup", name: "GearUp Select" },
  },
  {
    id: "demo-climbing-kit",
    name: "Summit Climbing Kit",
    brand: "Black Diamond",
    description: "Everything you need to find your line and climb with confidence.",
    pricePerDay: 28,
    stock: 6,
    isAvailable: true,
    images: [],
    category: { id: "climb", name: "Climbing", slug: "climbing" },
    provider: { id: "gearup", name: "GearUp Select" },
  },
];

const bentoFeatures = [
  {
    icon: CompassIcon,
    eyebrow: "Find your line",
    title: "Curated for the outside",
    description:
      "Skip the guesswork. Discover field-tested gear from people who know what it takes to go further.",
    className: "md:col-span-2",
    visual: "map",
  },
  {
    icon: LightningIcon,
    eyebrow: "Ready when you are",
    title: "Instant booking",
    description:
      "Pick your dates, lock in your kit, and get back to planning the good stuff.",
    className: "",
    visual: "pulse",
  },
  {
    icon: ShieldCheckIcon,
    eyebrow: "Go with confidence",
    title: "Trusted by design",
    description:
      "Verified providers, transparent pricing, and protection on every rental.",
    className: "",
    visual: "shield",
  },
  {
    icon: UsersThreeIcon,
    eyebrow: "Built together",
    title: "Gear that keeps moving",
    description:
      "Give great equipment a longer life while earning from the gear you already own.",
    className: "md:col-span-2",
    visual: "network",
  },
];

function FeatureVisual({ type }: { type: string }) {
  if (type === "map") {
    return (
      <div className="absolute -bottom-10 -right-10 h-48 w-80 opacity-60">
        <div className="absolute inset-0 rounded-full border border-lime-400/20" />
        <div className="absolute inset-8 rounded-full border border-lime-400/15" />
        <div className="absolute inset-16 rounded-full border border-lime-400/10" />
        <div className="absolute right-24 top-20 h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_24px_8px_rgba(153,234,72,0.35)]" />
        <svg viewBox="0 0 320 190" className="absolute inset-0 h-full w-full">
          <path d="M20 160 C80 130 60 70 140 100 S210 140 300 24" fill="none" stroke="rgba(153,234,72,0.5)" strokeWidth="1.5" strokeDasharray="4 5" />
        </svg>
      </div>
    );
  }
  if (type === "pulse") {
    return (
      <div className="absolute bottom-7 right-7 flex items-center gap-1 opacity-80">
        {[14, 26, 42, 22, 34, 18, 30].map((height, index) => (
          <span
            key={index}
            className="w-1 rounded-full bg-lime-400/70"
            style={{ height }}
          />
        ))}
      </div>
    );
  }
  if (type === "shield") {
    return (
      <div className="absolute bottom-6 right-7 flex h-14 w-14 items-center justify-center rounded-full border border-lime-400/20 bg-lime-400/5 text-lime-300 shadow-[0_0_30px_-8px_rgba(153,234,72,0.5)]">
        <CheckCircleIcon weight="duotone" className="h-7 w-7" />
      </div>
    );
  }
  return (
    <div className="absolute bottom-8 right-8 flex items-end gap-2 opacity-50">
      {["h-5", "h-9", "h-14", "h-8", "h-11"].map((height, index) => (
        <span key={index} className={`w-1 rounded-full bg-lime-400/60 ${height}`} />
      ))}
    </div>
  );
}

export default async function Home() {
  const fetchedGear = await fetchFeaturedGear(4);
  const featuredGear = fetchedGear.length > 0 ? fetchedGear : fallbackGear;

  return (
    <div className="flex flex-col overflow-hidden">
      <section className="relative isolate flex min-h-[680px] items-center justify-center px-6 pb-24 pt-24 sm:min-h-[760px] sm:pt-32">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-[-20%] h-[560px] w-[800px] -translate-x-1/2 rounded-full bg-lime-400/[0.07] blur-[120px]" />
          <div className="absolute -left-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-emerald-400/[0.05] blur-[100px]" />
          <div className="absolute -right-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-sky-500/[0.04] blur-[120px]" />
          <div className="absolute inset-0 border-grid opacity-30 [mask-image:linear-gradient(to_bottom,#000,transparent_80%)]" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent" />
        </div>

        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-[12px] font-medium text-muted-foreground backdrop-blur">
            <SparkleIcon weight="fill" className="h-3.5 w-3.5 text-lime-400" />
            <span>Go further. Pack lighter.</span>
            <ArrowUpRightIcon weight="bold" className="h-3 w-3 text-lime-400" />
          </div>
          <h1 className="animate-fade-in-up max-w-4xl text-5xl font-semibold leading-[1.05] tracking-[-0.045em] text-foreground [animation-delay:80ms] sm:text-7xl lg:text-[88px]">
            Adventure is better
            <br />
            <span className="text-gradient-lime">shared.</span>
          </h1>
          <p className="animate-fade-in-up mt-7 max-w-xl text-base leading-7 text-muted-foreground [animation-delay:160ms] sm:text-lg">
            Premium sports and outdoor gear, ready for wherever the trail takes
            you. Rent less. Experience more.
          </p>
          <div className="animate-fade-in-up mt-10 w-full [animation-delay:240ms]">
            <HeroSearch />
          </div>
          <div className="animate-fade-in-up mt-7 flex items-center gap-5 text-[12px] text-muted-foreground [animation-delay:320ms]">
            <span className="flex items-center gap-1.5">
              <MapPinIcon weight="duotone" className="h-3.5 w-3.5 text-lime-400" />
              Available everywhere
            </span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="flex items-center gap-1.5">
              <TimerIcon weight="duotone" className="h-3.5 w-3.5 text-lime-400" />
              Book in minutes
            </span>
          </div>
        </div>
      </section>

      <section className="relative border-y border-border bg-background px-6 py-24 sm:py-32">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-lime-400">
                The GearUp way
              </p>
              <h2 className="max-w-lg text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                The outside, on your terms.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Thoughtful tools for spontaneous plans, ambitious goals, and the
              everyday escape.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {bentoFeatures.map(({ icon: Icon, eyebrow, title, description, className, visual }) => (
              <div
                key={title}
                className={`group relative min-h-56 overflow-hidden rounded-xl border border-border bg-card p-6 transition-colors hover:border-lime-400/20 ${className}`}
              >
                <Icon weight="duotone" className="mb-8 h-6 w-6 text-lime-400" />
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {eyebrow}
                </p>
                <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground">
                  {title}
                </h3>
                <p className="max-w-sm text-[13px] leading-5 text-muted-foreground">
                  {description}
                </p>
                <FeatureVisual type={visual} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 sm:py-32">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-lime-400">
                Freshly listed
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Ready for your next.
              </h2>
            </div>
            <Link
              href="/gear"
              className="group hidden items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
            >
              View all gear
              <ArrowUpRightIcon weight="bold" className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredGear.map((gear) => (
              <GearCard key={gear.id} gear={gear} />
            ))}
          </div>
          <Link
            href="/gear"
            className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:hidden"
          >
            View all gear
            <ArrowUpRightIcon weight="bold" className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border px-6 py-24 sm:py-32">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(153,234,72,0.07),transparent_58%)]" />
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <TrendUpIcon weight="duotone" className="mb-5 h-7 w-7 text-lime-400" />
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            More time outside.
            <br />
            <span className="text-muted-foreground">Less stuff to store.</span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">
            Whether you&apos;re planning your first overnight or chasing the next
            summit, GearUp has the right equipment waiting.
          </p>
          <Link
            href="/gear"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-gradient-to-br from-lime-300 via-lime-400 to-lime-500 px-5 py-2.5 text-sm font-semibold text-black shadow-glow transition-transform hover:scale-[1.02]"
          >
            Explore the collection
            <ArrowRightIcon weight="bold" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
