"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  ArrowUUpLeftIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  SpinnerGapIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { fetchRentalOrder, type RentalOrder } from "@/shared/rentals";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE } from "@/shared/order";
import { cn } from "@/shared/utils/cn";

const REASON_COPY: Record<string, { title: string; message: string }> = {
  abandoned: {
    title: "Checkout was abandoned",
    message:
      "You closed the payment window before confirming. Your order is still pending and nothing was charged.",
  },
  failed: {
    title: "Payment failed",
    message:
      "Stripe was unable to capture the payment. Your bank may have more information.",
  },
  requires_payment_method: {
    title: "Choose another payment method",
    message:
      "The selected payment method was rejected. Try a different card or wallet.",
  },
  duplicate: {
    title: "Already in progress",
    message:
      "A pending payment was already created for this order — open it to complete checkout.",
  },
};

function PaymentCancelContent() {
  const params = useSearchParams();
  const orderId = params.get("order") ?? "";
  const reason = params.get("reason") ?? "abandoned";

  const reasonMeta = REASON_COPY[reason] ?? REASON_COPY.abandoned;

  const orderQuery = useQuery({
    queryKey: ["rental-order-cancel", orderId],
    queryFn: () => fetchRentalOrder(orderId),
    enabled: Boolean(orderId),
  });

  const order: RentalOrder | undefined = orderQuery.data;
  const totalAmount = Number(order?.totalAmount ?? 0);
  const itemCount = useMemo(
    () => order?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    [order],
  );

  return (
    <div className="container mx-auto flex min-h-[80vh] max-w-5xl flex-col items-center px-6 py-12 sm:py-16">
      <div className="flex w-full max-w-3xl flex-col items-center text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300 shadow-glow">
          <WarningCircleIcon weight="duotone" className="h-10 w-10" />
        </span>

        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300">
          Payment cancelled
        </p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Nothing was charged — but your order is still waiting.
        </h1>
        <p className="mt-3 max-w-xl text-balance text-sm leading-7 text-muted-foreground">
          {reasonMeta.message}
        </p>
      </div>

      <section className="mt-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10">
        <header className="flex items-center gap-3 border-b border-amber-500/20 px-6 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300">
            <WarningCircleIcon weight="duotone" className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300">
              Action required
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{reasonMeta.title}</p>
          </div>
        </header>
        <div className="grid grid-cols-1 gap-4 px-6 py-5 text-[13px] text-muted-foreground sm:grid-cols-2">
          <ReasonItem
            icon={CreditCardIcon}
            title="Update payment method"
            description="Try a different card or digital wallet in checkout."
          />
          <ReasonItem
            icon={ClockCountdownIcon}
            title="Order is on hold"
            description="Your dates and items remain reserved while you complete checkout."
          />
          <ReasonItem
            icon={ShieldCheckIcon}
            title="No funds were captured"
            description="Your bank statement will not show any charge."
          />
          <ReasonItem
            icon={ReceiptIcon}
            title="Safe to retry"
            description="You will never be double-charged when submitting a new card."
          />
        </div>
      </section>

      <div className="mt-10 grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-2xl border border-border bg-card/60">
          <header className="flex items-center justify-between border-b border-border bg-secondary/30 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ReceiptIcon weight="duotone" className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Order snapshot
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {orderId ? `#${orderId.slice(-8).toUpperCase()}` : "Pending order"}
                </p>
              </div>
            </div>
            {order ? (
              <span
                className={cn(
                  "rounded-md border px-2 py-1 text-[10px] font-semibold",
                  ORDER_STATUS_TONE[order.status],
                )}
              >
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            ) : null}
          </header>

          <div className="px-6 py-5">
            {orderQuery.isPending ? (
              <div className="space-y-3">
                <div className="h-3 animate-shimmer rounded" />
                <div className="h-3 animate-shimmer rounded" />
                <div className="h-3 animate-shimmer rounded" />
              </div>
            ) : order ? (
              <dl className="grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-2">
                <SnapshotRow
                  label="Items"
                  value={`${itemCount} item${itemCount === 1 ? "" : "s"}`}
                />
                <SnapshotRow
                  label="Rental period"
                  value={`${new Date(order.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })} – ${new Date(order.endDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}`}
                />
                <SnapshotRow
                  label="Total due"
                  value={
                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                      <CurrencyDollarIcon weight="bold" className="h-3.5 w-3.5 text-amber-300" />
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(totalAmount)}
                    </span>
                  }
                />
                <SnapshotRow
                  label="Booked by"
                  value={order.customer?.name ?? "You"}
                />
              </dl>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                We couldn’t load your order details. Head back to your orders to view the latest status.
              </p>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-border bg-card/60 p-5">
            <h3 className="text-sm font-semibold text-foreground">Resume checkout</h3>
            <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
              Pick up where you left off. We saved your order details.
            </p>
            <Button asChild size="lg" className="mt-4 w-full">
              <Link
                href={
                  orderId
                    ? `/dashboard/customer/orders/${orderId}/pay`
                    : "/dashboard/customer/orders"
                }
              >
                Retry payment
                <ArrowUUpLeftIcon weight="bold" className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm" className="mt-2 w-full">
              <Link href={`/dashboard/customer/orders/${orderId}`}>
                View order details
              </Link>
            </Button>
          </section>

          <section className="rounded-2xl border border-border bg-card/60 p-5">
            <h3 className="text-sm font-semibold text-foreground">Need help?</h3>
            <ul className="mt-3 space-y-2 text-[12px] text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircleIcon weight="fill" className="mt-0.5 h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                Confirm your card supports 3D-Secure.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon weight="fill" className="mt-0.5 h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                Try a different browser or device.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon weight="fill" className="mt-0.5 h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                Contact support if the issue persists.
              </li>
            </ul>
          </section>
        </aside>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="ghost" size="lg">
          <Link href="/gear">
            <ArrowLeftIcon weight="bold" className="h-3.5 w-3.5" />
            Browse more gear
          </Link>
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/dashboard/customer/orders">Open order list</Link>
        </Button>
      </div>
    </div>
  );
}

function ReasonItem({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ weight?: "duotone" | "bold" | "regular" | "fill"; className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300">
        <Icon weight="duotone" className="h-3.5 w-3.5" />
      </span>
      <div>
        <p className="text-[13px] font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-[12px] leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function SnapshotRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-[13px] text-foreground">{value}</dd>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-6 py-16">
          <SpinnerGapIcon
            weight="bold"
            className="h-6 w-6 animate-spin text-emerald-500 dark:text-emerald-400"
          />
        </div>
      }
    >
      <PaymentCancelContent />
    </Suspense>
  );
}
