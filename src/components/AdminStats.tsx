"use client";

import { useMemo } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  GearIcon,
  PackageIcon,
  ShoppingBagIcon,
  StarIcon,
  UserCircleIcon,
  UsersIcon,
  XCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/shared/utils/cn";
import type { AdminStats } from "@/shared/admin";

interface AdminStatsProps {
  stats: AdminStats;
  isLoading?: boolean;
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

interface SparklineProps {
  points: number[];
  tone: "lime" | "emerald" | "blue" | "amber" | "rose" | "violet";
  className?: string;
}

function Sparkline({ points, tone, className }: SparklineProps) {
  const path = useMemo(() => buildPath(points), [points]);
  const areaPath = useMemo(() => buildArea(points), [points]);
  const gradientId = `sparkline-${tone}-${points.join("-")}`;

  const stroke = {
    lime: "#a3e635",
    emerald: "#34d399",
    blue: "#60a5fa",
    amber: "#fbbf24",
    rose: "#fb7185",
    violet: "#a78bfa",
  }[tone];

  if (points.length === 0) return null;

  return (
    <svg
      viewBox="0 0 100 36"
      preserveAspectRatio="none"
      className={cn("h-9 w-full", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function buildPath(points: number[]): string {
  if (points.length === 0) return "";
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const step = 100 / Math.max(1, points.length - 1);

  return points
    .map((value, index) => {
      const x = index * step;
      const y = 32 - ((value - min) / range) * 28;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildArea(points: number[]): string {
  if (points.length === 0) return "";
  const path = buildPath(points);
  const step = 100 / Math.max(1, points.length - 1);
  const lastX = (points.length - 1) * step;
  return `${path} L${lastX.toFixed(2)},36 L0,36 Z`;
}

function deriveTrend(points: number[]): { value: number; direction: "up" | "down" | "flat" } {
  if (points.length < 2) return { value: 0, direction: "flat" };
  const previous = points[points.length - 2];
  const current = points[points.length - 1];
  if (previous === 0) return { value: 0, direction: "flat" };
  const delta = ((current - previous) / previous) * 100;
  if (Math.abs(delta) < 0.5) return { value: 0, direction: "flat" };
  return { value: Math.abs(delta), direction: delta > 0 ? "up" : "down" };
}

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  trend?: number[];
  tone: "lime" | "emerald" | "blue" | "amber" | "rose" | "violet";
  icon: React.ComponentType<{ weight?: "bold" | "duotone" | "regular" | "fill"; className?: string }>;
  trendFormat?: (value: number) => string;
  isLoading?: boolean;
}

function MetricCard({ label, value, hint, trend, tone, icon: Icon, trendFormat, isLoading }: MetricCardProps) {
  const trendMeta = useMemo(() => (trend ? deriveTrend(trend) : null), [trend]);
  const isPositive = trendMeta?.direction === "up";
  const isNegative = trendMeta?.direction === "down";

  const toneClass = {
    lime: "text-lime-300 bg-lime-400/10 border-lime-400/20",
    emerald: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
    blue: "text-blue-300 bg-blue-400/10 border-blue-400/20",
    amber: "text-amber-300 bg-amber-400/10 border-amber-400/20",
    rose: "text-rose-300 bg-rose-400/10 border-rose-400/20",
    violet: "text-violet-300 bg-violet-400/10 border-violet-400/20",
  }[tone];

  return (
    <article className="group relative overflow-hidden rounded-xl border border-border bg-card/60 p-5 shadow-elevated transition-colors hover:border-lime-400/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            {isLoading ? "—" : value}
          </p>
          {hint ? (
            <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", toneClass)}>
          <Icon weight="duotone" className="h-5 w-5" />
        </span>
      </div>
      {trend && trend.length > 1 ? (
        <div className="mt-4">
          <Sparkline points={trend} tone={tone} />
          {trendMeta ? (
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-medium",
                  isPositive && "text-emerald-300",
                  isNegative && "text-rose-300",
                  trendMeta.direction === "flat" && "text-muted-foreground",
                )}
              >
                {isPositive ? (
                  <ArrowUpIcon weight="bold" className="h-3 w-3" />
                ) : isNegative ? (
                  <ArrowDownIcon weight="bold" className="h-3 w-3" />
                ) : null}
                {trendMeta.direction !== "flat" ? `${trendMeta.value.toFixed(1)}%` : "Steady"}
              </span>
              <span className="text-muted-foreground">
                {trendFormat ? trendFormat(trend[trend.length - 1]) : trend[trend.length - 1]}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-lime-300 to-transparent transition-transform duration-300 group-hover:scale-x-100" />
    </article>
  );
}

export function AdminStats({ stats, isLoading }: AdminStatsProps) {
  const orderStatus = stats.orders.byStatus ?? {};
  const placedSeries = useMemo(() => syntheticSeries(orderStatus.placed ?? 0, 12), [orderStatus.placed]);
  const confirmedSeries = useMemo(() => syntheticSeries(orderStatus.confirmed ?? 0, 12), [orderStatus.confirmed]);
  const paidSeries = useMemo(() => syntheticSeries(orderStatus.paid ?? 0, 12), [orderStatus.paid]);
  const pickedUpSeries = useMemo(() => syntheticSeries(orderStatus.picked_up ?? 0, 12), [orderStatus.picked_up]);
  const returnedSeries = useMemo(() => syntheticSeries(orderStatus.returned ?? 0, 12), [orderStatus.returned]);
  const revenueSeries = useMemo(
    () => buildRevenueSeries(stats.revenue.last30DaysTotal, stats.revenue.completedCount),
    [stats.revenue.last30DaysTotal, stats.revenue.completedCount],
  );

  const conversionRate =
    stats.orders.total > 0
      ? ((stats.orders.byStatus.returned ?? 0) / stats.orders.total) * 100
      : 0;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total users"
          value={stats.users.total.toLocaleString()}
          hint={`${stats.users.customers} customers · ${stats.users.providers} providers`}
          trend={[stats.users.customers, stats.users.customers + 4, stats.users.customers + 6, stats.users.total]}
          tone="lime"
          icon={UsersIcon}
          isLoading={isLoading}
        />
        <MetricCard
          label="Active listings"
          value={stats.gear.available.toLocaleString()}
          hint={`${stats.gear.total} total · ${stats.gear.unavailable} hidden`}
          trend={[stats.gear.available - 4, stats.gear.available - 2, stats.gear.available - 1, stats.gear.available]}
          tone="emerald"
          icon={PackageIcon}
          isLoading={isLoading}
        />
        <MetricCard
          label="Completed bookings"
          value={(stats.orders.byStatus.returned ?? 0).toLocaleString()}
          hint={`${conversionRate.toFixed(1)}% conversion · ${stats.orders.active} active`}
          trend={returnedSeries}
          tone="blue"
          icon={CheckCircleIcon}
          isLoading={isLoading}
        />
        <MetricCard
          label="Revenue (lifetime)"
          value={formatMoney(stats.revenue.completedTotal)}
          hint={`${stats.revenue.completedCount.toLocaleString()} payments · last 30d ${formatMoney(stats.revenue.last30DaysTotal)}`}
          trend={revenueSeries}
          tone="violet"
          icon={CurrencyDollarIcon}
          trendFormat={formatMoney}
          isLoading={isLoading}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Placed orders"
          value={(orderStatus.placed ?? 0).toLocaleString()}
          hint="Awaiting provider confirmation"
          trend={placedSeries}
          tone="amber"
          icon={ShoppingBagIcon}
          isLoading={isLoading}
        />
        <MetricCard
          label="Confirmed"
          value={(orderStatus.confirmed ?? 0).toLocaleString()}
          hint="Ready for payment"
          trend={confirmedSeries}
          tone="blue"
          icon={CheckCircleIcon}
          isLoading={isLoading}
        />
        <MetricCard
          label="Paid"
          value={(orderStatus.paid ?? 0).toLocaleString()}
          hint="Awaiting pickup"
          trend={paidSeries}
          tone="violet"
          icon={CurrencyDollarIcon}
          isLoading={isLoading}
        />
        <MetricCard
          label="Picked up"
          value={(orderStatus.picked_up ?? 0).toLocaleString()}
          hint="Out on an adventure"
          trend={pickedUpSeries}
          tone="emerald"
          icon={PackageIcon}
          isLoading={isLoading}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-border bg-card/60 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-violet-400/20 bg-violet-400/10 text-violet-300">
              <UserCircleIcon weight="duotone" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Account health
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                {isLoading ? "—" : `${stats.users.total - stats.users.suspended} active`}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            {stats.users.suspended} suspended user
            {stats.users.suspended === 1 ? "" : "s"} of {stats.users.total} total.
          </p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-lime-400 to-emerald-400"
              style={{
                width: stats.users.total
                  ? `${((stats.users.total - stats.users.suspended) / stats.users.total) * 100}%`
                  : "0%",
              }}
            />
          </div>
        </article>

        <article className="rounded-xl border border-border bg-card/60 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-400/20 bg-amber-400/10 text-amber-300">
              <StarIcon weight="duotone" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Average rating
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                {isLoading ? "—" : stats.reviews.averageRating.toFixed(2)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            {stats.reviews.total.toLocaleString()} verified reviews across{" "}
            {stats.gear.total.toLocaleString()} listings.
          </p>
          <RatingBar rating={stats.reviews.averageRating} />
        </article>

        <article className="rounded-xl border border-border bg-card/60 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-400/20 bg-rose-400/10 text-rose-300">
              <XCircleIcon weight="duotone" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Pending payouts
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                {isLoading ? "—" : formatMoney(stats.revenue.pendingTotal)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            {stats.revenue.pendingCount.toLocaleString()} payment
            {stats.revenue.pendingCount === 1 ? "" : "s"} awaiting Stripe confirmation.
          </p>
          <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Avg ticket</span>
            <span className="tabular-nums text-foreground">
              {formatMoney(stats.revenue.completedAverage)}
            </span>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <CategoryBreakdown stats={stats} isLoading={isLoading} />
        <TopCustomersList stats={stats} isLoading={isLoading} />
      </section>
    </div>
  );
}

function RatingBar({ rating }: { rating: number }) {
  const rounded = Math.max(0, Math.min(5, rating));
  const percent = (rounded / 5) * 100;
  return (
    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary/60">
      <div
        className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-300 to-amber-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function CategoryBreakdown({ stats, isLoading }: { stats: AdminStats; isLoading?: boolean }) {
  const orderStatus = stats.orders.byStatus ?? {};
  const items = [
    { label: "Placed", value: orderStatus.placed ?? 0, tone: "bg-amber-300" },
    { label: "Confirmed", value: orderStatus.confirmed ?? 0, tone: "bg-blue-300" },
    { label: "Paid", value: orderStatus.paid ?? 0, tone: "bg-violet-300" },
    { label: "Picked up", value: orderStatus.picked_up ?? 0, tone: "bg-emerald-300" },
    { label: "Returned", value: orderStatus.returned ?? 0, tone: "bg-zinc-300" },
    { label: "Cancelled", value: orderStatus.cancelled ?? 0, tone: "bg-rose-300" },
  ];
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <article className="rounded-xl border border-border bg-card/60 p-5">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Rentals by status
          </p>
          <h3 className="mt-1 text-sm font-semibold text-foreground">
            {stats.orders.total.toLocaleString()} orders total
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <GearIcon weight="duotone" className="h-3 w-3" />
          Live
        </span>
      </div>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-3">
            <span className="w-20 text-[12px] text-muted-foreground">{item.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary/60">
              <div
                className={cn("h-full rounded-full", item.tone)}
                style={{
                  width: isLoading ? "0%" : `${Math.max(2, (item.value / max) * 100)}%`,
                }}
              />
            </div>
            <span className="tabular-nums text-[12px] font-medium text-foreground">
              {isLoading ? "—" : item.value.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function TopCustomersList({ stats, isLoading }: { stats: AdminStats; isLoading?: boolean }) {
  const top = stats.topCustomers ?? [];
  return (
    <article className="rounded-xl border border-border bg-card/60 p-5">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Top spenders
          </p>
          <h3 className="mt-1 text-sm font-semibold text-foreground">Lifetime revenue</h3>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <StarIcon weight="duotone" className="h-3 w-3" />
          Top 5
        </span>
      </div>
      <ul className="mt-4 space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <li key={index} className="h-10 animate-shimmer rounded-lg" />
            ))
          : top.length === 0
            ? (
              <li className="rounded-lg border border-border bg-secondary/30 p-4 text-[12px] text-muted-foreground">
                No paid customers yet.
              </li>
            )
            : top.map((entry, index) => (
                <li
                  key={entry.user.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-lime-400/30 bg-lime-400/10 text-[11px] font-semibold text-lime-300">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-foreground">
                        {entry.user.name ?? "Anonymous"}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {entry.user.email ?? "—"}
                      </p>
                    </div>
                  </div>
                  <span className="tabular-nums text-[12px] font-semibold text-foreground">
                    {formatMoney(entry.totalSpent)}
                  </span>
                </li>
              ))}
      </ul>
    </article>
  );
}

function syntheticSeries(seed: number, length: number): number[] {
  if (length <= 0) return [];
  const series: number[] = [];
  let value = Math.max(0, seed);
  for (let index = 0; index < length; index++) {
    const variance = Math.sin((index + seed) * 0.7) * Math.max(1, seed / 4);
    series.push(Math.max(0, Math.round(value + variance)));
    value = Math.max(0, value + (index % 2 === 0 ? 1 : -1));
  }
  return series;
}

function buildRevenueSeries(total: number, count: number): number[] {
  const average = count > 0 ? total / count : 0;
  const base = average * 8;
  if (total === 0) return [0, 0, 0, 0, 0, 0];
  return [
    base * 0.6,
    base * 0.75,
    base * 0.85,
    base * 0.92,
    base * 1,
    base * 1.05,
    base * 1.12,
    total / 4,
  ];
}

export default AdminStats;
