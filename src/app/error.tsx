"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowClockwiseIcon,
  HouseIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[app:error]", error);
  }, [error]);

  return (
    <section className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(244,63,94,0.08),transparent_38%)]" />
      <div className="relative mx-auto w-full max-w-xl rounded-2xl border border-border bg-card/70 p-8 text-center shadow-elevated backdrop-blur-md sm:p-10">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-300">
          <WarningCircleIcon weight="duotone" className="h-6 w-6" />
        </span>
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Application error
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Something broke on our end.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          An unexpected error occurred while rendering this page. Our team has been notified.
          You can try again, or head back home to continue exploring GearUp.
        </p>

        {error.digest ? (
          <p className="mx-auto mt-5 inline-flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Trace
            </span>
            {error.digest}
          </p>
        ) : null}

        {error.message ? (
          <p className="mt-4 max-w-md mx-auto truncate rounded-md border border-border/60 bg-secondary/20 px-3 py-2 font-mono text-[11px] text-muted-foreground">
            {error.message}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={() => reset()} size="lg">
            <ArrowClockwiseIcon weight="bold" className="h-4 w-4" />
            Try again
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <HouseIcon weight="bold" className="h-4 w-4" />
              Back home
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
