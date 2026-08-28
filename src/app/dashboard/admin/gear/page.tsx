"use client";

import Link from "next/link";
import { ArrowRightIcon, ShoppingBagIcon } from "@phosphor-icons/react/dist/ssr";
import { DashboardShell } from "@/components/DashboardShell";
import { ADMIN_NAV_TABS } from "@/components/dashboards/adminNav";
import { Button } from "@/components/ui/Button";

export default function AdminGearPage() {
  return (
    <DashboardShell
      eyebrow="Admin workspace"
      title="Gear moderation"
      description="Review flagged listings, audit provider submissions, and curate the public catalogue."
      tabs={ADMIN_NAV_TABS}
      variant="sidebar"
      actions={
        <Button asChild variant="secondary" size="sm">
          <Link href="/dashboard/admin">
            Back to overview
            <ArrowRightIcon weight="bold" className="h-3.5 w-3.5" />
          </Link>
        </Button>
      }
    >
      <section className="mx-auto flex max-w-2xl flex-col items-center rounded-2xl border border-border bg-card/60 px-6 py-16 text-center shadow-elevated">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <ShoppingBagIcon weight="duotone" className="h-6 w-6" />
        </span>
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Coming soon
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Gear moderation queue is on the way
        </h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          A dedicated review surface for listings, takedown reasons, and provider audits will land
          here alongside the next admin release.
        </p>
      </section>
    </DashboardShell>
  );
}
