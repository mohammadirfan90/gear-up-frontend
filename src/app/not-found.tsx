import Link from "next/link";
import { ArrowLeftIcon, CompassIcon, HouseIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(16,185,129,0.09),transparent_38%)]" />
      <div className="relative mx-auto w-full max-w-xl text-center">
        <div className="font-mono text-[clamp(7rem,24vw,13rem)] font-bold leading-none tracking-[-0.12em] text-foreground/10 select-none">
          404
        </div>
        <div className="-mt-16 sm:-mt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            <CompassIcon weight="bold" className="h-3.5 w-3.5" />
            Off the trail
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            This page could not be found.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            The route may have moved, or the gear you are looking for is no longer available here.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/">
                <HouseIcon weight="bold" className="h-4 w-4" />
                Back home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/gear">
                Browse gear
                <ArrowLeftIcon weight="bold" className="h-4 w-4 rotate-180" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
