"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  ArrowUUpLeftIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  CopyIcon,
  GearIcon,
  PackageIcon,
  PrinterIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react/dist/ssr";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { fetchRentalOrder, type RentalOrder } from "@/shared/rentals";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE } from "@/shared/order";
import { cn } from "@/shared/utils/cn";

/** Stop polling after ~90s rather than hammering the API forever. */
const MAX_POLL_ATTEMPTS = 30;
const POLL_INTERVAL_MS = 3000;

const REDIRECT_STATUS_COPY: Record<string, { tone: string; label: string; message: string }> = {
  failed: {
    tone: "text-destructive",
    label: "Payment failed",
    message:
      "Stripe could not complete this payment. Nothing was charged — you can retry from the order page.",
  },
  pending: {
    tone: "text-amber-300",
    label: "Payment pending",
    message: "Stripe is still finalising your payment. Hang tight while we sync the order.",
  },
  succeeded: {
    tone: "text-emerald-300",
    label: "Payment succeeded",
    message: "Your payment was confirmed by Stripe. We’re syncing the order status now.",
  },
  processing: {
    tone: "text-amber-300",
    label: "Payment processing",
    message: "Stripe is still finalising your payment. Hang tight while we sync the order.",
  },
  requires_payment_method: {
    tone: "text-amber-300",
    label: "Choose another method",
    message: "Your payment method was rejected. Please retry with a different card.",
  },
  requires_action: {
    tone: "text-blue-300",
    label: "Action required",
    message: "Stripe needs additional authentication. We’ll let you know if anything is needed.",
  },
};

function PaymentSuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("order") ?? "";
  const paymentIntent = params.get("payment_intent") ?? params.get("intent") ?? "";
  const redirectStatus = params.get("redirect_status") ?? "succeeded";

  const statusMeta =
    REDIRECT_STATUS_COPY[redirectStatus] ?? REDIRECT_STATUS_COPY.succeeded;

  const [pollAttempts, setPollAttempts] = useState(0);

  const orderQuery = useQuery({
    queryKey: ["rental-order-after-payment", orderId],
    queryFn: async () => {
      const result = await fetchRentalOrder(orderId);
      setPollAttempts((attempts) => attempts + 1);
      return result;
    },
    enabled: Boolean(orderId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "paid" || status === "picked_up" || status === "returned") {
        return false;
      }
      // Bounded: an unconfigured or unreachable webhook would otherwise leave
      // this page polling indefinitely.
      return pollAttempts >= MAX_POLL_ATTEMPTS ? false : POLL_INTERVAL_MS;
    },
  });

  const order = orderQuery.data;
  const isSucceeded =
    order?.status === "paid" || order?.status === "picked_up" || order?.status === "returned";
  const isConfirmed = Boolean(isSucceeded);
  const pollExhausted =
    Boolean(order) && !isSucceeded && pollAttempts >= MAX_POLL_ATTEMPTS;

  const totalAmount = Number(order?.totalAmount ?? 0);
  const itemCount = useMemo(
    () => order?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    [order],
  );

  const orderShortId = order ? order.id.slice(-8).toUpperCase() : "";
  const intentShort = paymentIntent ? paymentIntent.slice(-12).toUpperCase() : "";

  const handleCopy = async (value: string, label: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Unable to copy");
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <div className="container mx-auto flex min-h-[80vh] max-w-5xl flex-col items-center px-6 py-12 sm:py-16">
      <div className="flex w-full max-w-3xl flex-col items-center text-center">
        <SuccessAnimation confirmed={isConfirmed} />

        <p
          className={cn(
            "mt-6 text-[11px] font-semibold uppercase tracking-[0.2em]",
            statusMeta.tone,
          )}
        >
          {statusMeta.label}
        </p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {isConfirmed ? "Payment confirmed — your trip is booked." : "Hang tight, we’re finalising your payment."}
        </h1>
        <p className="mt-3 max-w-xl text-balance text-sm leading-7 text-muted-foreground">
          {isConfirmed
            ? "Your payment has been captured by Stripe. The provider will be notified to prepare your gear for pickup."
            : statusMeta.message}
        </p>

        {pollExhausted ? (
          <div className="mt-6 flex w-full max-w-xl items-start gap-3 rounded-lg border border-amber-400/30 bg-amber-500/5 px-4 py-3 text-left">
            <ClockCountdownIcon
              weight="duotone"
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-300"
            />
            <div>
              <p className="text-[13px] font-medium text-foreground">
                Still waiting on confirmation
              </p>
              <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                Your card may already have been charged. Open the order to
                re-check its status, and quote order{" "}
                <span className="font-mono">#{orderShortId || "—"}</span> if you
                need to contact support.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => {
                  setPollAttempts(0);
                  void orderQuery.refetch();
                }}
              >
                Check again
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-12 grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ReceiptCard
          orderId={orderId}
          orderShortId={orderShortId}
          order={order}
          itemCount={itemCount}
          totalAmount={totalAmount}
          paymentIntent={paymentIntent}
          intentShort={intentShort}
          isSucceeded={isSucceeded}
          onCopy={handleCopy}
        />

        <NextStepsCard orderId={orderId} />
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3 print:hidden">
        <Button asChild size="lg">
          <Link
            href={orderId ? `/dashboard/customer/orders/${orderId}` : "/dashboard/customer/orders"}
          >
            View order
            <ArrowRightIcon weight="bold" className="h-4 w-4" />
          </Link>
        </Button>
        <Button onClick={handlePrint} variant="secondary" size="lg">
          <PrinterIcon weight="bold" className="h-4 w-4" />
          Print receipt
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/gear">
            <ArrowUUpLeftIcon weight="bold" className="h-3.5 w-3.5" />
            Browse more gear
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground print:hidden">
        <ShieldCheckIcon weight="duotone" className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
        Secured by Stripe · Funds held until pickup confirmation
      </div>
    </div>
  );
}

function SuccessAnimation({ confirmed }: { confirmed: boolean }) {
  const [shown, setShown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timer.current = setTimeout(() => setShown(true), 60);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <span
        className={cn(
          "absolute inset-0 rounded-full border border-emerald-400/30 bg-emerald-500/5 transition-all duration-700",
          shown ? "scale-100 opacity-100" : "scale-75 opacity-0",
        )}
      />
      <span
        className={cn(
          "absolute inset-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 transition-all delay-150 duration-700",
          shown ? "scale-100 opacity-100" : "scale-50 opacity-0",
        )}
      />
      <span
        className={cn(
          "relative flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 shadow-glow transition-all delay-300 duration-500",
          shown ? "scale-100 opacity-100" : "scale-90 opacity-0",
        )}
      >
        {confirmed ? (
          <CheckCircleIcon weight="duotone" className="h-9 w-9" />
        ) : (
          <SpinnerGapIcon weight="bold" className="h-8 w-8 animate-spin" />
        )}
      </span>
    </div>
  );
}

interface ReceiptCardProps {
  orderId: string;
  orderShortId: string;
  order: RentalOrderShape;
  itemCount: number;
  totalAmount: number;
  paymentIntent: string;
  intentShort: string;
  isSucceeded: boolean;
  onCopy: (value: string, label: string) => void;
}

type RentalOrderShape = RentalOrder | undefined;

function ReceiptCard({
  orderId,
  orderShortId,
  order,
  itemCount,
  totalAmount,
  paymentIntent,
  intentShort,
  isSucceeded,
  onCopy,
}: ReceiptCardProps) {
  const formatted = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(totalAmount),
    [totalAmount],
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card/60">
      <header className="flex items-center justify-between border-b border-border bg-secondary/30 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ReceiptIcon weight="duotone" className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Receipt
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {orderShortId ? `Order #${orderShortId}` : "Awaiting confirmation"}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-md border px-2 py-1 text-[10px] font-semibold",
            isSucceeded
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
              : "border-amber-400/30 bg-amber-500/10 text-amber-300",
          )}
        >
          {isSucceeded ? "Captured" : "Pending"}
        </span>
      </header>

      <dl className="grid grid-cols-1 divide-y divide-border">
        <ReceiptRow
          icon={ReceiptIcon}
          label="Order ID"
          value={orderShortId ? `#${orderShortId}` : "—"}
          trailing={
            orderShortId ? (
              <button
                type="button"
                onClick={() => onCopy(orderShortId, "Order ID")}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                aria-label="Copy order id"
              >
                <CopyIcon weight="bold" className="h-3 w-3" />
                Copy
              </button>
            ) : null
          }
        />
        <ReceiptRow
          icon={GearIcon}
          label="Payment intent"
          value={intentShort || "Awaiting"}
          trailing={
            paymentIntent ? (
              <button
                type="button"
                onClick={() => onCopy(paymentIntent, "Payment intent")}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                aria-label="Copy payment intent"
              >
                <CopyIcon weight="bold" className="h-3 w-3" />
                Copy
              </button>
            ) : null
          }
        />
        <ReceiptRow
          icon={CalendarBlankIcon}
          label="Rental period"
          value={
            order
              ? `${new Date(order.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })} – ${new Date(order.endDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}`
              : "Pending confirmation"
          }
        />
        <ReceiptRow
          icon={PackageIcon}
          label="Items"
          value={`${itemCount} item${itemCount === 1 ? "" : "s"}`}
        />
      </dl>

      <div className="border-t border-border px-6 py-5">
        <div className="flex items-end justify-between">
          <span className="text-sm font-medium text-muted-foreground">Total paid</span>
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            {formatted}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Processed via Stripe · Authorised and held until pickup
        </p>
      </div>

      {order ? (
        <div className="border-t border-border bg-secondary/20 px-6 py-4 text-[12px] text-muted-foreground">
          <span
            className={cn(
              "inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
              ORDER_STATUS_TONE[order.status],
            )}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <span className="ml-2">Live order status from GearUp</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-t border-border bg-secondary/20 px-6 py-4 text-[12px] text-muted-foreground">
          <ClockCountdownIcon weight="duotone" className="h-3.5 w-3.5 text-amber-300" />
          Polling the order for the latest status…
        </div>
      )}
    </section>
  );
}

function ReceiptRow({
  icon: Icon,
  label,
  value,
  trailing,
}: {
  icon: React.ComponentType<{ weight?: "duotone" | "bold" | "regular" | "fill"; className?: string }>;
  label: string;
  value: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3.5">
      <span className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <Icon weight="duotone" className="h-3.5 w-3.5" />
        {label}
      </span>
      <div className="flex items-center gap-3 text-right">
        <span className="font-mono text-[12px] font-medium text-foreground">{value}</span>
        {trailing}
      </div>
    </div>
  );
}

function NextStepsCard({ orderId }: { orderId: string }) {
  return (
    <aside className="space-y-4">
      <section className="rounded-2xl border border-border bg-card/60 p-5">
        <h3 className="text-sm font-semibold text-foreground">What happens next</h3>
        <ol className="mt-4 space-y-3 text-[12px] text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              1
            </span>
            Stripe confirms payment and notifies GearUp.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              2
            </span>
            The provider prepares your gear for the agreed pickup day.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              3
            </span>
            Once returned, leave a review from the order page.
          </li>
        </ol>
      </section>

      <section className="rounded-2xl border border-border bg-card/60 p-5">
        <h3 className="text-sm font-semibold text-foreground">Need help?</h3>
        <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
          If your order status doesn’t update within a few minutes, reach out via the support inbox and reference your order ID.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4 w-full">
          <Link href={orderId ? `/dashboard/customer/orders/${orderId}` : "/dashboard/customer/orders"}>
            Go to order
            <ArrowRightIcon weight="bold" className="h-3 w-3" />
          </Link>
        </Button>
      </section>
    </aside>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 py-16">
          <SpinnerGapIcon
            weight="bold"
            className="h-6 w-6 animate-spin text-emerald-500 dark:text-emerald-400"
          />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
