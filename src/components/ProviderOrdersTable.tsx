"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowRightIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  PackageIcon,
  ReceiptIcon,
  SpinnerGapIcon,
  UserCircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { cn } from "@/shared/utils/cn";
import {
  fetchProviderOrders,
  updateProviderOrderStatus,
  type ProviderOrder,
  type ProviderOrderStatus,
} from "@/shared/providerOrders";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE } from "@/shared/order";

interface ProviderOrdersTableProps {
  limit?: number;
}

type FilterKey = "all" | "queue" | "active" | "completed";

const TRANSITION_BUTTONS: Record<
  ProviderOrderStatus,
  {
    target: ProviderOrderStatus;
    label: string;
    tone: "default" | "secondary" | "outline";
    icon: React.ComponentType<{ weight?: "bold" | "duotone" | "regular" | "fill"; className?: string }>;
  }[]
> = {
  placed: [
    {
      target: "confirmed",
      label: "Confirm",
      tone: "default",
      icon: CheckCircleIcon,
    },
  ],
  confirmed: [],
  paid: [
    {
      target: "picked_up",
      label: "Mark Picked Up",
      tone: "default",
      icon: PackageIcon,
    },
  ],
  picked_up: [
    {
      target: "returned",
      label: "Mark Returned",
      tone: "secondary",
      icon: ReceiptIcon,
    },
  ],
  returned: [],
  cancelled: [],
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
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
  all: "All",
  queue: "Action queue",
  active: "Active",
  completed: "Completed",
};

const filterPredicate: Record<FilterKey, (order: ProviderOrder) => boolean> = {
  all: () => true,
  queue: (order) => order.status === "placed" || order.status === "paid",
  active: (order) =>
    ["placed", "confirmed", "paid", "picked_up"].includes(order.status),
  completed: (order) =>
    ["returned", "cancelled"].includes(order.status),
};

export function ProviderOrdersTable({ limit = 50 }: ProviderOrdersTableProps) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterKey>("queue");

  const ordersQuery = useQuery({
    queryKey: ["provider-orders", limit],
    queryFn: () => fetchProviderOrders({ limit }),
  });

  const statusMutation = useMutation({
    mutationFn: (input: { orderId: string; target: ProviderOrderStatus }) =>
      updateProviderOrderStatus(input.orderId, input.target),
    onMutate: async ({ orderId, target }) => {
      await queryClient.cancelQueries({ queryKey: ["provider-orders"] });
      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof fetchProviderOrders>>>([
        "provider-orders",
        limit,
      ]);
      if (previous) {
        queryClient.setQueryData<typeof previous>(["provider-orders", limit], {
          ...previous,
          items: previous.items.map((order) =>
            order.id === orderId ? { ...order, status: target } : order,
          ),
        });
      }
      return { previous };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["provider-orders", limit], context.previous);
      }
      toast.error(error.message || "Unable to update order status");
    },
    onSuccess: (order, variables) => {
      const label = ORDER_STATUS_LABELS[variables.target];
      toast.success(`Order marked as ${label}`);
      queryClient.invalidateQueries({ queryKey: ["provider-orders"] });
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      queryClient.invalidateQueries({ queryKey: ["rental-order", order.id] });
    },
  });

  const orders = ordersQuery.data?.items ?? [];
  const total = ordersQuery.data?.pagination?.total ?? orders.length;
  const filtered = useMemo(() => orders.filter(filterPredicate[filter]), [orders, filter]);

  const counts: Record<FilterKey, number> = {
    all: total,
    queue: orders.filter(filterPredicate.queue).length,
    active: orders.filter(filterPredicate.active).length,
    completed: orders.filter(filterPredicate.completed).length,
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card/60">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Incoming orders</h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {total} total · {counts.queue} awaiting action
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

      {ordersQuery.isPending ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-16 animate-shimmer rounded-lg" />
          ))}
        </div>
      ) : ordersQuery.isError ? (
        <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
          <ClockCountdownIcon weight="duotone" className="mb-3 h-7 w-7 text-amber-300" />
          <p className="text-sm font-medium text-foreground">
            Unable to load incoming orders
          </p>
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
            {orders.length === 0 ? "No incoming orders yet" : "No matching orders"}
          </p>
          <p className="mt-1 max-w-xs text-[12px] leading-5 text-muted-foreground">
            {orders.length === 0
              ? "New rentals will appear here when customers book your gear."
              : "Try a different filter to see more of your queue."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden grid-cols-[minmax(0,1fr)_140px_160px_120px_220px] gap-4 border-b border-border bg-secondary/20 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground md:grid">
            <span>Order</span>
            <span>Customer</span>
            <span>Dates</span>
            <span>Amount</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="divide-y divide-border">
            {filtered.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                isUpdating={statusMutation.isPending && statusMutation.variables?.orderId === order.id}
                onTransition={(target) =>
                  statusMutation.mutate({ orderId: order.id, target })
                }
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function OrderRow({
  order,
  isUpdating,
  onTransition,
}: {
  order: ProviderOrder;
  isUpdating: boolean;
  onTransition: (target: ProviderOrderStatus) => void;
}) {
  const buttons = TRANSITION_BUTTONS[order.status] ?? [];
  const shortId = order.id.slice(-8).toUpperCase();
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <article className="flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-secondary/30 md:grid md:grid-cols-[minmax(0,1fr)_140px_160px_120px_220px] md:items-center md:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground">
          <ReceiptIcon weight="duotone" className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/provider/orders/${order.id}`}
              className="truncate text-[13px] font-medium text-foreground hover:text-lime-300"
            >
              Order #{shortId}
            </Link>
            <span
              className={cn(
                "shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                ORDER_STATUS_TONE[order.status],
              )}
            >
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {order.items[0]?.gearItem?.name ?? "Gear item"}
            {itemCount > 1 ? ` +${itemCount - 1} more` : ""} · placed {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-secondary/50 text-[10px] font-semibold text-foreground">
          {order.customer.name
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-foreground">{order.customer.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">{order.customer.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <CalendarBlankIcon weight="duotone" className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-foreground">{formatDateRange(order.startDate, order.endDate)}</span>
      </div>

      <div className="text-[13px] font-semibold tabular-nums text-foreground">
        {formatMoney(Number(order.totalAmount))}
      </div>

      <div className="flex items-center justify-end gap-2">
        {buttons.length > 0 ? (
          buttons.map((button) => {
            const Icon = button.icon;
            return (
              <Button
                key={button.target}
                type="button"
                size="sm"
                variant={button.tone}
                className="h-8 px-2.5 text-[11px]"
                disabled={isUpdating}
                onClick={() => onTransition(button.target)}
              >
                {isUpdating ? (
                  <SpinnerGapIcon weight="bold" className="h-3 w-3 animate-spin" />
                ) : (
                  <Icon weight="bold" className="h-3 w-3" />
                )}
                {button.label}
              </Button>
            );
          })
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <WarningCircleIcon weight="bold" className="h-3 w-3" />
            Awaiting renter
          </span>
        )}
        <Link
          href={`/dashboard/provider/orders/${order.id}`}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          Open
          <ArrowRightIcon weight="bold" className="h-3 w-3" />
        </Link>
      </div>
    </article>
  );
}

export default ProviderOrdersTable;
