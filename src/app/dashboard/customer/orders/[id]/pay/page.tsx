"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  CreditCardIcon,
  PackageIcon,
  ReceiptIcon,
  UserCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { DashboardShell, type DashboardTab } from "@/components/DashboardShell";
import { Button } from "@/components/ui/Button";
import { StripePaymentForm } from "@/components/StripePaymentForm";
import { fetchRentalOrder } from "@/shared/rentals";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE } from "@/shared/order";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/shared/utils/cn";

const tabs: DashboardTab[] = [
  {
    label: "Overview",
    href: "/dashboard/customer",
    icon: PackageIcon,
    description: "Rental activity at a glance",
  },
  {
    label: "Orders",
    href: "/dashboard/customer/orders",
    icon: ReceiptIcon,
    description: "Track your rental history",
  },
  {
    label: "Payments",
    href: "/dashboard/customer/payments",
    icon: CreditCardIcon,
    description: "Invoices and transactions",
  },
  {
    label: "Profile",
    href: "/dashboard/customer/profile",
    icon: UserCircleIcon,
    description: "Personal settings",
  },
];

interface PayPageProps {
  params: Promise<{ id: string }>;
}

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

export default function PayOrderPage({ params }: PayPageProps) {
  const { id } = use(params);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const orderQuery = useQuery({
    queryKey: ["rental-order", id],
    queryFn: () => fetchRentalOrder(id),
    enabled: isAuthenticated && Boolean(id),
  });

  const order = orderQuery.data;
  const shortId = id.slice(-8).toUpperCase();
  const totalAmount = Number(order?.totalAmount ?? 0);
  const payable = order?.status === "placed" || order?.status === "confirmed";

  return (
    <DashboardShell
      eyebrow="Secure checkout"
      title="Complete your payment"
      description="Pay securely with Stripe. Funds are held until the provider confirms your pickup."
      tabs={tabs}
      actions={
        <Button asChild variant="ghost" size="sm">
          <Link href={`/dashboard/customer/orders/${id}`}>
            <ArrowLeftIcon weight="bold" className="h-3.5 w-3.5" />
            Back to order
          </Link>
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-xl border border-border bg-card/60 p-6">
          {orderQuery.isPending ? (
            <div className="space-y-4">
              <div className="h-16 animate-shimmer rounded-lg" />
              <div className="h-44 animate-shimmer rounded-lg" />
              <div className="h-12 animate-shimmer rounded-lg" />
            </div>
          ) : orderQuery.isError ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <ClockCountdownIcon
                weight="duotone"
                className="mb-3 h-7 w-7 text-amber-300"
              />
              <p className="text-sm font-medium text-foreground">
                Unable to load this order
              </p>
              <p className="mt-1 max-w-sm text-[12px] leading-5 text-muted-foreground">
                We couldn’t fetch the rental details. Please refresh the page or
                return to your orders list.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => orderQuery.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : order && payable ? (
            <StripePaymentForm
              rentalOrderId={order.id}
              amount={totalAmount}
              orderShortId={shortId}
            />
          ) : order ? (
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/5 p-5">
              <div className="flex items-start gap-3">
                <CheckCircleIcon
                  weight="duotone"
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    This order is already paid
                  </p>
                  <p className="mt-1 text-[13px] leading-6 text-muted-foreground">
                    Status:{" "}
                    <span
                      className={cn(
                        "inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
                        ORDER_STATUS_TONE[order.status],
                      )}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-4">
                    <Link href={`/dashboard/customer/orders/${order.id}`}>
                      View order details
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-card/60 p-5">
            <h2 className="text-sm font-semibold text-foreground">Order summary</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Order #{shortId}
            </p>

            {orderQuery.isPending ? (
              <div className="mt-4 space-y-3">
                <div className="h-12 animate-shimmer rounded-lg" />
                <div className="h-12 animate-shimmer rounded-lg" />
                <div className="h-12 animate-shimmer rounded-lg" />
              </div>
            ) : order ? (
              <>
                <dl className="mt-4 space-y-3 border-t border-border pt-4 text-[13px]">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted-foreground">Dates</dt>
                    <dd className="flex items-center gap-1.5 text-right font-medium text-foreground">
                      <CalendarBlankIcon weight="duotone" className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDateRange(order.startDate, order.endDate)}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted-foreground">Items</dt>
                    <dd className="text-right font-medium text-foreground">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} item
                      {order.items.reduce((sum, item) => sum + item.quantity, 0) === 1
                        ? ""
                        : "s"}
                    </dd>
                  </div>
                  {order.items[0]?.gearItem ? (
                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-muted-foreground">First item</dt>
                      <dd className="text-right font-medium text-foreground">
                        {order.items[0].gearItem.name}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                <dl className="mt-4 space-y-2 border-t border-border pt-4 text-[13px]">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 text-muted-foreground"
                    >
                      <span>
                        {item.gearItem?.name ?? "Gear item"} × {item.quantity}
                      </span>
                      <span className="tabular-nums text-foreground">
                        {formatMoney(Number(item.subtotal))}
                      </span>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
                  <span className="text-sm font-medium text-muted-foreground">Total due</span>
                  <span className="text-2xl font-semibold tracking-tight text-foreground">
                    {formatMoney(totalAmount)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Placed {formatDate(order.createdAt)}
                </p>
              </>
            ) : null}
          </section>

          <section className="rounded-xl border border-border bg-card/60 p-5">
            <h3 className="text-sm font-semibold text-foreground">What happens next</h3>
            <ol className="mt-3 space-y-2.5 text-[12px] text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-lime-400/30 bg-lime-400/10 text-[10px] font-semibold text-lime-300">
                  1
                </span>
                Your payment is confirmed instantly via Stripe.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-lime-400/30 bg-lime-400/10 text-[10px] font-semibold text-lime-300">
                  2
                </span>
                The provider marks the order <strong className="text-foreground">Picked up</strong> on pickup day.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-lime-400/30 bg-lime-400/10 text-[10px] font-semibold text-lime-300">
                  3
                </span>
                After return, you can leave a review from the order page.
              </li>
            </ol>
          </section>
        </aside>
      </div>
    </DashboardShell>
  );
}
