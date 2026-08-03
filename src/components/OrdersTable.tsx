"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  CalendarBlankIcon,
  ClockCountdownIcon,
  CreditCardIcon,
  PackageIcon,
  ReceiptIcon,
  WarningCircleIcon,
  StarIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { cn } from "@/shared/utils/cn";
import { type RentalOrder, type RentalListResult } from "@/shared/rentals";
import api, { type ApiEnvelope } from "@/shared/api";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE } from "@/shared/order";

interface OrdersTableProps {
  initialData?: RentalListResult;
  limit?: number;
  showFilters?: boolean;
}

type FilterKey = "all" | "active" | "completed";

const fetchOrders = async (limit: number): Promise<RentalListResult> => {
  const { data } = await api.get<ApiEnvelope<RentalListResult>>(
    `/rentals?limit=${limit}`,
  );
  return data.data;
};

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

const filterLabels: Record<FilterKey, string> = {
  all: "All orders",
  active: "Active",
  completed: "Completed",
};

const filterPredicate: Record<FilterKey, (order: RentalOrder) => boolean> = {
  all: () => true,
  active: (order) =>
    ["placed", "confirmed", "paid", "picked_up"].includes(order.status),
  completed: (order) =>
    ["returned", "cancelled"].includes(order.status),
};

export function OrdersTable({ initialData, limit = 50, showFilters = true }: OrdersTableProps) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const ordersQuery = useQuery({
    queryKey: ["customer-orders", limit],
    queryFn: () => fetchOrders(limit),
    initialData,
    refetchOnMount: initialData ? false : true,
  });

  const orders = ordersQuery.data?.items ?? [];
  const total = ordersQuery.data?.pagination?.total ?? orders.length;
  const filtered = orders.filter(filterPredicate[filter]);

  const counts: Record<FilterKey, number> = {
    all: total,
    active: orders.filter(filterPredicate.active).length,
    completed: orders.filter(filterPredicate.completed).length,
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card/60">
      {showFilters ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Your orders</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {total} total rental{total === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/30 p-1">
            {(Object.keys(filterLabels) as FilterKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                  filter === key
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {filterLabels[key]}
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                    filter === key
                      ? "bg-lime-400/20 text-lime-300"
                      : "bg-secondary/60 text-muted-foreground",
                  )}
                >
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {ordersQuery.isPending ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-16 animate-shimmer rounded-lg" />
          ))}
        </div>
      ) : ordersQuery.isError ? (
        <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
          <ClockCountdownIcon weight="duotone" className="mb-3 h-7 w-7 text-amber-300" />
          <p className="text-sm font-medium text-foreground">Unable to load orders</p>
          <button
            type="button"
            onClick={() => ordersQuery.refetch()}
            className="mt-3 text-[12px] font-medium text-lime-300 hover:text-lime-200"
          >
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
          <PackageIcon weight="duotone" className="mb-3 h-7 w-7 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {orders.length === 0 ? "No orders yet" : "No matching orders"}
          </p>
          <p className="mt-1 max-w-xs text-[12px] leading-5 text-muted-foreground">
            {orders.length === 0
              ? "Browse the gear catalog and place your first rental to see it here."
              : "Try a different filter to see more of your rental history."}
          </p>
          {orders.length === 0 ? (
            <Button asChild size="sm" className="mt-4">
              <Link href="/gear">Explore gear</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="hidden grid-cols-[minmax(0,1fr)_140px_120px_120px_140px] gap-4 border-b border-border bg-secondary/20 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground md:grid">
            <span>Order</span>
            <span>Dates</span>
            <span>Items</span>
            <span>Amount</span>
            <span className="text-right">Status</span>
          </div>

          <div className="divide-y divide-border">
            {filtered.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function OrderRow({ order }: { order: RentalOrder }) {
  const shortId = order.id.slice(-8).toUpperCase();
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <article className="group flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-secondary/30 md:grid md:grid-cols-[minmax(0,1fr)_140px_120px_120px_140px] md:items-center md:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground">
          <ReceiptIcon weight="duotone" className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <Link
            href={`/dashboard/customer/orders/${order.id}`}
            className="block truncate text-[13px] font-medium text-foreground hover:text-lime-300"
          >
            Order #{shortId}
          </Link>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Placed {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[12px] text-muted-foreground md:text-foreground">
        <CalendarBlankIcon weight="duotone" className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{formatDateRange(order.startDate, order.endDate)}</span>
      </div>

      <div className="text-[12px] tabular-nums text-foreground">
        {itemCount} item{itemCount === 1 ? "" : "s"}
      </div>

      <div className="text-[13px] font-semibold tabular-nums text-foreground">
        {formatMoney(Number(order.totalAmount))}
      </div>

      <div className="flex items-center justify-between gap-2 md:justify-end">
        <span
          className={cn(
            "rounded-md border px-2 py-1 text-[10px] font-semibold",
            ORDER_STATUS_TONE[order.status],
          )}
        >
          {ORDER_STATUS_LABELS[order.status]}
        </span>
        <OrderStatusActions order={order} />
      </div>
    </article>
  );
}

function OrderStatusActions({ order }: { order: RentalOrder }) {
  if (order.status === "confirmed") {
    return (
      <Button asChild size="sm" className="h-7 px-2.5 text-[11px]">
        <Link href={`/dashboard/customer/orders/${order.id}/pay`}>
          <CreditCardIcon weight="bold" className="h-3 w-3" />
          Pay now
        </Link>
      </Button>
    );
  }

  if (order.status === "returned") {
    return (
      <Button asChild size="sm" variant="outline" className="h-7 px-2.5 text-[11px]">
        <Link href={`/dashboard/customer/orders/${order.id}#review`}>
          <StarIcon weight="bold" className="h-3 w-3" />
          Review
        </Link>
      </Button>
    );
  }

  if (order.status === "paid" || order.status === "picked_up") {
    return (
      <Link
        href={`/dashboard/customer/orders/${order.id}`}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
      >
        Open
        <ArrowRightIcon weight="bold" className="h-3 w-3" />
      </Link>
    );
  }

  if (order.status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <WarningCircleIcon weight="bold" className="h-3 w-3" />
        Closed
      </span>
    );
  }

  return (
    <Link
      href={`/dashboard/customer/orders/${order.id}`}
      className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
    >
      View
      <ArrowRightIcon weight="bold" className="h-3 w-3" />
    </Link>
  );
}

export default OrdersTable;
