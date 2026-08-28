"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarBlankIcon,
  ClockCountdownIcon,
  CurrencyDollarIcon,
  PackageIcon,
  ReceiptIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react/dist/ssr";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/Button";
import { ADMIN_NAV_TABS } from "@/components/dashboards/adminNav";
import { cn } from "@/shared/utils/cn";
import {
  fetchAdminRentals,
  type AdminRental,
  type AdminRentalListParams,
} from "@/shared/admin";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE } from "@/shared/order";

const LIMIT = 12;

const STATUS_OPTIONS: { value: "" | AdminRental["status"]; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "placed", label: "Placed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "paid", label: "Paid" },
  { value: "picked_up", label: "Picked up" },
  { value: "returned", label: "Returned" },
  { value: "cancelled", label: "Cancelled" },
];

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

const formatDateRange = (start: string, end: string) => {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  return `${formatter.format(new Date(start))} – ${formatter.format(new Date(end))}`;
};

export default function AdminRentalsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<
    "" | AdminRental["status"]
  >("");
  const [search, setSearch] = useState("");

  const params = useMemo<AdminRentalListParams>(
    () => ({
      page,
      limit: LIMIT,
      ...(statusFilter ? { status: statusFilter } : {}),
    }),
    [page, statusFilter],
  );

  const rentalsQuery = useQuery({
    queryKey: ["admin-rentals", params],
    queryFn: () => fetchAdminRentals(params),
    placeholderData: (previous) => previous,
  });

  const items = rentalsQuery.data?.items ?? [];
  const pagination = rentalsQuery.data?.pagination;

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const needle = search.trim().toLowerCase();
    return items.filter((rental) =>
      [
        rental.id,
        rental.customer.name,
        rental.customer.email,
        rental.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [items, search]);

  const totals = useMemo(() => {
    const total = items.reduce((sum, r) => sum + Number(r.totalAmount), 0);
    const itemsCount = items.reduce((sum, r) => sum + r.items.length, 0);
    return { revenue: total, itemsCount };
  }, [items]);

  return (
    <DashboardShell
      eyebrow="Admin workspace"
      title="Rental audit"
      description="Inspect every rental flowing through the marketplace. Filter, search, and review transaction history."
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
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-border bg-card/60 p-5 shadow-elevated">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Total orders
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {rentalsQuery.isPending ? "—" : (pagination?.total ?? 0).toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Across all statuses and providers
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <PackageIcon weight="duotone" className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-border bg-card/60 p-5 shadow-elevated">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Page revenue
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {rentalsQuery.isPending ? "—" : formatMoney(totals.revenue)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Sum of orders on this page
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-violet-400/20 bg-violet-400/10 text-violet-300">
              <CurrencyDollarIcon weight="duotone" className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-border bg-card/60 p-5 shadow-elevated">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Items rented
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {rentalsQuery.isPending ? "—" : totals.itemsCount.toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Line items across this page
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
              <ReceiptIcon weight="duotone" className="h-5 w-5" />
            </span>
          </div>
        </article>
      </section>

      <section className="mt-8 overflow-hidden rounded-xl border border-border bg-card/60">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">All rentals</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {pagination
                ? `${pagination.total.toLocaleString()} order${pagination.total === 1 ? "" : "s"} on record`
                : "Loading…"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search this page"
              aria-label="Search this page"
              className="h-9 rounded-md border border-input bg-secondary/30 px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as typeof statusFilter);
                setPage(1);
              }}
              aria-label="Filter by status"
              className="h-9 rounded-md border border-input bg-secondary/30 px-3 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {rentalsQuery.isPending ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 animate-shimmer rounded-lg" />
            ))}
          </div>
        ) : rentalsQuery.isError ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <ClockCountdownIcon weight="duotone" className="mb-3 h-7 w-7 text-amber-300" />
            <p className="text-sm font-medium text-foreground">
              Unable to load rentals
            </p>
            <button
              type="button"
              onClick={() => rentalsQuery.refetch()}
              className="mt-3 text-[12px] font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <PackageIcon weight="duotone" className="mb-3 h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No rentals match</p>
            <p className="mt-1 max-w-xs text-[12px] leading-5 text-muted-foreground">
              {items.length === 0
                ? "There are no rentals matching the current filter."
                : "Try adjusting your search term."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,1fr)_160px_140px_140px_120px_120px] gap-4 border-b border-border bg-secondary/20 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground md:grid">
              <span>Order</span>
              <span>Customer</span>
              <span>Dates</span>
              <span>Items</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Status</span>
            </div>

            <div className="divide-y divide-border">
              {filtered.map((rental) => (
                <RentalRow key={rental.id} rental={rental} />
              ))}
            </div>
          </>
        )}
      </section>

      {pagination ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/40 px-4 py-3 text-[12px] text-muted-foreground">
          <span>
            Page {pagination.page} of {Math.max(1, pagination.totalPages)} ·{" "}
            {pagination.total.toLocaleString()} total
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={!pagination.hasPrev || rentalsQuery.isFetching}
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
              disabled={!pagination.hasNext || rentalsQuery.isFetching}
              className="h-8 px-2.5 text-[11px]"
            >
              Next
              <ArrowRightIcon weight="bold" className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : null}

      {rentalsQuery.isFetching && !rentalsQuery.isPending ? (
        <div className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-[11px] text-muted-foreground backdrop-blur">
          <SpinnerGapIcon weight="bold" className="h-3 w-3 animate-spin text-emerald-500 dark:text-emerald-400" />
          Syncing rentals…
        </div>
      ) : null}
    </DashboardShell>
  );
}

function RentalRow({ rental }: { rental: AdminRental }) {
  const shortId = rental.id.slice(-8).toUpperCase();
  const initials = rental.customer.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <article className="flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-secondary/30 md:grid md:grid-cols-[minmax(0,1fr)_160px_140px_140px_120px_120px] md:items-center md:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground">
          <ReceiptIcon weight="duotone" className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <Link
            href={`/dashboard/admin/rentals/${rental.id}`}
            className="block truncate text-[13px] font-medium text-foreground hover:text-emerald-500 dark:hover:text-emerald-400"
          >
            Order #{shortId}
          </Link>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Opened {formatDate(rental.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-secondary/50 text-[10px] font-semibold text-foreground">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-foreground">{rental.customer.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {rental.customer.email}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <CalendarBlankIcon weight="duotone" className="h-3.5 w-3.5" />
        <span className="text-foreground">{formatDateRange(rental.startDate, rental.endDate)}</span>
      </div>

      <div className="text-[12px] tabular-nums text-foreground">
        {rental.items.length} item{rental.items.length === 1 ? "" : "s"}
      </div>

      <div className="text-right text-[13px] font-semibold tabular-nums text-foreground">
        {formatMoney(Number(rental.totalAmount))}
      </div>

      <div className="flex justify-end">
        <span
          className={cn(
            "rounded-md border px-2 py-1 text-[10px] font-semibold",
            ORDER_STATUS_TONE[rental.status],
          )}
        >
          {ORDER_STATUS_LABELS[rental.status]}
        </span>
      </div>
    </article>
  );
}
