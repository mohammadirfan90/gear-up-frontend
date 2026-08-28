"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowSquareOutIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  MagnifyingGlassIcon,
  PackageIcon,
  ShoppingBagIcon,
  SpinnerGapIcon,
  StorefrontIcon,
  TagIcon,
  XCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/Button";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { ADMIN_NAV_TABS } from "@/components/dashboards/adminNav";
import { cn } from "@/shared/utils/cn";
import { fetchAdminGear, fetchAdminStats, type AdminGearItem } from "@/shared/admin";

const LIMIT = 12;

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

export default function AdminGearPage() {
  const [page, setPage] = useState(1);
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "unavailable">("all");
  const [search, setSearch] = useState("");

  const isAvailableParam =
    availabilityFilter === "available"
      ? true
      : availabilityFilter === "unavailable"
        ? false
        : undefined;

  const statsQuery = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchAdminStats,
  });

  const gearQuery = useQuery({
    queryKey: ["admin", "gear", { page, limit: LIMIT, isAvailable: isAvailableParam }],
    queryFn: () =>
      fetchAdminGear({
        page,
        limit: LIMIT,
        ...(isAvailableParam !== undefined && { isAvailable: isAvailableParam }),
      }),
  });

  const items = gearQuery.data?.items ?? [];
  const pagination = gearQuery.data?.pagination;

  const filtered = useMemo(() => {
    let result = items;

    if (availabilityFilter === "available") {
      result = result.filter((item) => item.isAvailable === true);
    } else if (availabilityFilter === "unavailable") {
      result = result.filter((item) => item.isAvailable === false);
    }

    const term = search.trim().toLowerCase();
    if (!term) return result;

    return result.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.category.name.toLowerCase().includes(term) ||
        (item.brand && item.brand.toLowerCase().includes(term)) ||
        item.provider.name.toLowerCase().includes(term) ||
        item.provider.email.toLowerCase().includes(term),
    );
  }, [items, availabilityFilter, search]);

  const totalCount = statsQuery.data?.gear.total ?? pagination?.total ?? items.length;
  const availableCount = statsQuery.data?.gear.available ?? items.filter((i) => i.isAvailable).length;
  const unavailableCount = statsQuery.data?.gear.unavailable ?? items.filter((i) => !i.isAvailable).length;

  return (
    <DashboardShell
      eyebrow="Admin workspace"
      title="Gear moderation"
      description="Inspect all gear listings, review provider catalogues, and verify stock availability."
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
      {/* Summary Metrics */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-border bg-card/60 p-5 shadow-elevated">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Total Listings
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {statsQuery.isPending && gearQuery.isPending ? "—" : totalCount.toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Catalogues from all registered providers
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShoppingBagIcon weight="duotone" className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-border bg-card/60 p-5 shadow-elevated">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Active Listings
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
                {statsQuery.isPending && gearQuery.isPending ? "—" : availableCount.toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Ready for rental booking
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircleIcon weight="duotone" className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-border bg-card/60 p-5 shadow-elevated">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Unavailable
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-rose-500 dark:text-rose-400">
                {statsQuery.isPending && gearQuery.isPending ? "—" : unavailableCount.toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Paused or out of stock
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-500">
              <XCircleIcon weight="duotone" className="h-5 w-5" />
            </span>
          </div>
        </article>
      </section>

      {/* Filter & Search Bar */}
      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-secondary/30 p-1">
          <button
            type="button"
            onClick={() => {
              setAvailabilityFilter("all");
              setPage(1);
            }}
            className={cn(
              "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
              availabilityFilter === "all"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            All listings
          </button>
          <button
            type="button"
            onClick={() => {
              setAvailabilityFilter("available");
              setPage(1);
            }}
            className={cn(
              "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
              availabilityFilter === "available"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Available only
          </button>
          <button
            type="button"
            onClick={() => {
              setAvailabilityFilter("unavailable");
              setPage(1);
            }}
            className={cn(
              "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
              availabilityFilter === "unavailable"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Unavailable only
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <MagnifyingGlassIcon
            weight="bold"
            className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search gear, brand, provider…"
            className="h-9 w-full rounded-lg border border-border bg-card/60 pl-8 pr-3 text-[12px] text-foreground placeholder:text-muted-foreground focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
      </section>

      {/* Listings Table */}
      <section className="mb-6 overflow-hidden rounded-xl border border-border bg-card/60 shadow-elevated">
        {gearQuery.isPending ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 px-5 py-4">
                <div className="h-12 w-12 animate-shimmer rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 animate-shimmer rounded" />
                  <div className="h-3 w-1/4 animate-shimmer rounded" />
                </div>
                <div className="h-6 w-20 animate-shimmer rounded" />
              </div>
            ))}
          </div>
        ) : gearQuery.isError ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <XCircleIcon weight="duotone" className="mb-3 h-7 w-7 text-destructive" />
            <p className="text-sm font-medium text-foreground">Unable to load gear catalogue</p>
            <button
              type="button"
              onClick={() => gearQuery.refetch()}
              className="mt-3 text-[12px] font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <PackageIcon weight="duotone" className="mb-3 h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No gear listings found</p>
            <p className="mt-1 max-w-xs text-[12px] leading-5 text-muted-foreground">
              {items.length === 0
                ? "There are no listings matching the selected status."
                : "Try adjusting your search keywords."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,2fr)_140px_160px_100px_100px_100px_80px] gap-4 border-b border-border bg-secondary/20 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground lg:grid">
              <span>Item</span>
              <span>Category</span>
              <span>Provider</span>
              <span className="text-right">Price/Day</span>
              <span className="text-center">Stock</span>
              <span className="text-center">Status</span>
              <span className="text-right">Action</span>
            </div>

            <div className="divide-y divide-border">
              {filtered.map((item) => (
                <GearModerationRow key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Pagination */}
      {pagination && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/40 px-4 py-3 text-[12px] text-muted-foreground">
          <span>
            Page {pagination.page} of {Math.max(1, pagination.totalPages)} ·{" "}
            {pagination.total.toLocaleString()} total listing{pagination.total === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={!pagination.hasPrev || gearQuery.isFetching}
              className="h-8 px-2.5 text-[11px]"
            >
              <ArrowLeftIcon weight="bold" className="h-3 w-3" />
              Previous
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setPage((value) => (pagination.hasNext ? value + 1 : value))
              }
              disabled={!pagination.hasNext || gearQuery.isFetching}
              className="h-8 px-2.5 text-[11px]"
            >
              Next
              <ArrowRightIcon weight="bold" className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {gearQuery.isFetching && !gearQuery.isPending ? (
        <div className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-[11px] text-muted-foreground backdrop-blur">
          <SpinnerGapIcon weight="bold" className="h-3 w-3 animate-spin text-emerald-500 dark:text-emerald-400" />
          Syncing catalogue…
        </div>
      ) : null}
    </DashboardShell>
  );
}

function GearModerationRow({ item }: { item: AdminGearItem }) {
  const image = item.images?.[0] ?? null;

  return (
    <article className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-secondary/20 lg:grid lg:grid-cols-[minmax(0,2fr)_140px_160px_100px_100px_100px_80px] lg:items-center lg:gap-4">
      {/* Gear details */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary/50">
          <ImageWithFallback
            src={image}
            alt={item.name}
            fill
            sizes="48px"
            className="object-cover"
            fallbackLabel=""
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-foreground">
            {item.name}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            {item.brand && <span>{item.brand}</span>}
            {item.brand && <span>·</span>}
            <span>Added {formatDate(item.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Category */}
      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <TagIcon weight="duotone" className="h-3.5 w-3.5 text-emerald-500" />
        <span className="truncate text-foreground">{item.category.name}</span>
      </div>

      {/* Provider */}
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <StorefrontIcon weight="duotone" className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate text-foreground">{item.provider.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">{item.provider.email}</p>
        </div>
      </div>

      {/* Price */}
      <div className="text-right text-[13px] font-semibold tabular-nums text-foreground">
        {formatMoney(Number(item.pricePerDay))}
      </div>

      {/* Stock */}
      <div className="text-center text-[12px] tabular-nums text-foreground">
        {item.stock} in stock
      </div>

      {/* Availability Status */}
      <div className="flex justify-center">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold",
            item.isAvailable
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-rose-400/30 bg-rose-500/10 text-rose-500",
          )}
        >
          {item.isAvailable ? (
            <>
              <CheckCircleIcon weight="fill" className="h-3 w-3" />
              Available
            </>
          ) : (
            <>
              <XCircleIcon weight="fill" className="h-3 w-3" />
              Unavailable
            </>
          )}
        </span>
      </div>

      {/* Action */}
      <div className="flex justify-end">
        <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
          <Link href={`/gear/${item.id}`} title="View public listing" target="_blank">
            <ArrowSquareOutIcon weight="bold" className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
