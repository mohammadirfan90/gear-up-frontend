"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  CreditCardIcon,
  InfoIcon,
  PackageIcon,
  ReceiptIcon,
  StarIcon,
  UserCircleIcon,
  XCircleIcon,
  WalletIcon,
  WarningIcon,
} from "@phosphor-icons/react/dist/ssr";
import { DashboardShell, type DashboardTab } from "@/components/DashboardShell";
import { Button } from "@/components/ui/Button";
import { ReviewModal } from "@/components/ReviewModal";
import toast from "react-hot-toast";
import {
  cancelRentalOrder,
  fetchRentalOrder,
  type RentalOrder,
} from "@/shared/rentals";
import { getApiErrorMessage } from "@/shared/apiError";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONE,
  PAYMENT_STATUS_TONE,
} from "@/shared/order";
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
    icon: WalletIcon,
    description: "Invoices and transactions",
  },
  {
    label: "Profile",
    href: "/dashboard/customer/profile",
    icon: UserCircleIcon,
    description: "Personal settings",
  },
];

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

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

const computeRentalDays = (start: string, end: string): number => {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.max(1, Math.ceil(ms / MS_PER_DAY));
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  succeeded: "Succeeded",
  completed: "Succeeded",
  paid: "Succeeded",
  failed: "Failed",
  refunded: "Refunded",
};

const PAYMENT_STATUS_ICON: Record<
  string,
  React.ComponentType<{
    weight?: "fill" | "duotone" | "regular" | "bold";
    className?: string;
  }>
> = {
  pending: ClockCountdownIcon,
  succeeded: CheckCircleIcon,
  completed: CheckCircleIcon,
  paid: CheckCircleIcon,
  failed: XCircleIcon,
  refunded: ReceiptIcon,
};

const NEXT_STEPS: Record<
  RentalOrder["status"],
  { title: string; steps: string[]; tone: "info" | "warn" | "success" | "closed" }
> = {
  placed: {
    title: "Waiting on the provider",
    tone: "info",
    steps: [
      "Your provider reviews your request and confirms availability.",
      "Once confirmed you can pay securely through Stripe.",
      "Pick up the gear on the start date.",
      "Return on the end date and leave a quick review.",
    ],
  },
  confirmed: {
    title: "Ready to pay",
    tone: "info",
    steps: [
      "Settle the rental securely through Stripe.",
      "Pick up the gear on the start date.",
      "Return on the end date.",
      "Leave a review to help fellow renters.",
    ],
  },
  paid: {
    title: "Paid — gear is yours on the start date",
    tone: "info",
    steps: [
      "Pick up the gear on the start date.",
      "The provider marks it as Picked up.",
      "Return the gear on the end date.",
      "Leave a review to close out the rental.",
    ],
  },
  picked_up: {
    title: "Out on your adventure",
    tone: "info",
    steps: [
      "Enjoy your gear!",
      "Return it on the end date to the provider.",
      "Once returned, you'll see the order switch to Returned.",
      "Leave a review to wrap things up.",
    ],
  },
  returned: {
    title: "Rental complete",
    tone: "success",
    steps: [
      "Thanks for returning the gear on time.",
      "Leave a quick review to help other renters.",
      "Browse the catalog to plan your next trip.",
      "Need help? Reach out via Support.",
    ],
  },
  cancelled: {
    title: "Order cancelled",
    tone: "closed",
    steps: [
      "This order has been cancelled and is closed.",
      "Any reserved stock has been released back to the provider.",
      "Browse other gear to plan your next adventure.",
      "Contact support if you need help with a refund.",
    ],
  },
};

const NEXT_STEP_TONE: Record<
  "info" | "warn" | "success" | "closed",
  { border: string; bg: string; text: string; icon: React.ComponentType<{ weight?: "fill" | "duotone" | "regular" | "bold"; className?: string }> }
> = {
  info: {
    border: "border-blue-400/20",
    bg: "bg-blue-500/5",
    text: "text-blue-300",
    icon: InfoIcon,
  },
  warn: {
    border: "border-amber-400/20",
    bg: "bg-amber-500/5",
    text: "text-amber-300",
    icon: WarningIcon,
  },
  success: {
    border: "border-emerald-400/20",
    bg: "bg-emerald-500/5",
    text: "text-emerald-300",
    icon: CheckCircleIcon,
  },
  closed: {
    border: "border-zinc-400/20",
    bg: "bg-zinc-500/5",
    text: "text-zinc-300",
    icon: WarningIcon,
  },
};

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const queryClient = useQueryClient();

  const [reviewOpen, setReviewOpen] = useState(false);
  const reviewSectionRef = useRef<HTMLElement | null>(null);

  const orderQuery = useQuery({
    queryKey: ["rental-order", id],
    queryFn: () => fetchRentalOrder(id),
    enabled: isAuthenticated && Boolean(id),
  });

  const order = orderQuery.data;
  const shortId = id.slice(-8).toUpperCase();
  const status = order?.status;
  const totalAmount = Number(order?.totalAmount ?? 0);

  const totalItems = useMemo(
    () => order?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    [order],
  );

  const rentalDays = useMemo(() => {
    if (!order) return 0;
    return computeRentalDays(order.startDate, order.endDate);
  }, [order]);

  const firstGear = order?.items[0]?.gearItem;

  // Auto-open the review modal when arriving via #review anchor.
  useEffect(() => {
    if (!order || typeof window === "undefined") return;
    if (window.location.hash === "#review" && status === "returned") {
      setReviewOpen(true);
      requestAnimationFrame(() => {
        reviewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [order, status]);

  // Payment only opens once the provider has confirmed — the state machine is
  // placed → confirmed → paid, and the server rejects anything else.
  const showPayNow = status === "confirmed";
  const showReviewButton = status === "returned";
  const showCancel = status === "placed" || status === "confirmed";

  const cancelMutation = useMutation({
    mutationFn: () => cancelRentalOrder(id),
    onSuccess: () => {
      toast.success("Order cancelled");
      queryClient.invalidateQueries({ queryKey: ["rental-order", id] });
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      queryClient.invalidateQueries({ queryKey: ["gear-occupied-dates"] });
    },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, "Unable to cancel this order")),
  });

  return (
    <DashboardShell
      eyebrow={`Order #${shortId}`}
      title={order ? `Order details` : "Loading order…"}
      description={
        order
          ? `Placed ${formatDate(order.createdAt)} · ${totalItems} item${
              totalItems === 1 ? "" : "s"
            } · ${rentalDays} day${rentalDays === 1 ? "" : "s"}`
          : "Fetching the latest rental details from our servers."
      }
      tabs={tabs}
      actions={
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/customer/orders">
            <ArrowLeftIcon weight="bold" className="h-3.5 w-3.5" />
            Back to orders
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
                We couldn't fetch the rental details. Please refresh the page or
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
          ) : order ? (
            <div className="space-y-6">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Rental order
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                    Order #{shortId}
                  </h2>
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <CalendarBlankIcon weight="duotone" className="h-3.5 w-3.5" />
                    Placed {formatDate(order.createdAt)}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold",
                    status ? ORDER_STATUS_TONE[status] : "border-zinc-400/30 bg-zinc-500/10 text-zinc-300",
                  )}
                >
                  {status ? ORDER_STATUS_LABELS[status] : "Unknown"}
                </span>
              </header>

              <div className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-secondary/20 p-4 sm:grid-cols-3">
                <Stat
                  icon={CalendarBlankIcon}
                  label="Rental window"
                  value={formatDateRange(order.startDate, order.endDate)}
                  hint={`${rentalDays} day${rentalDays === 1 ? "" : "s"}`}
                />
                <Stat
                  icon={PackageIcon}
                  label="Items"
                  value={`${totalItems} item${totalItems === 1 ? "" : "s"}`}
                  hint={firstGear?.name ? `Starts with ${firstGear.name}` : undefined}
                />
                <Stat
                  icon={WalletIcon}
                  label="Total"
                  value={formatMoney(totalAmount)}
                  hint={
                    showPayNow
                      ? "Payment pending"
                      : status === "paid" ||
                          status === "picked_up" ||
                          status === "returned"
                        ? "Paid in full"
                        : status === "cancelled"
                          ? "Refunded or voided"
                          : undefined
                  }
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground">Items</h3>
                <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
                  {order.items.map((item) => {
                    const gear = item.gearItem;
                    const cover = gear?.images?.[0];
                    return (
                      <li
                        key={item.id}
                        className="flex items-start gap-4 p-4 first:rounded-t-lg last:rounded-b-lg"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-secondary/40">
                          {cover ? (
                            <Image
                              src={cover}
                              alt={gear?.name ?? "Gear item"}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <PackageIcon weight="duotone" className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-foreground">
                            {gear?.name ?? "Gear item"}
                          </p>
                          {gear?.brand ? (
                            <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                              {gear.brand}
                            </p>
                          ) : null}
                          <p className="mt-1 text-[12px] text-muted-foreground">
                            {item.quantity} × {formatMoney(Number(item.pricePerDay))} / day
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[13px] font-semibold tabular-nums text-foreground">
                            {formatMoney(Number(item.subtotal))}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {rentalDays} day{rentalDays === 1 ? "" : "s"}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {order.notes ? (
                <div className="rounded-lg border border-border bg-secondary/20 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Notes from you
                  </p>
                  <p className="mt-2 whitespace-pre-line text-[13px] leading-6 text-foreground">
                    {order.notes}
                  </p>
                </div>
              ) : null}

              <section
                id="review"
                ref={reviewSectionRef}
                className="rounded-lg border border-border bg-secondary/20 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Share your experience
                    </p>
                    <h3 className="mt-1 text-base font-semibold tracking-tight text-foreground">
                      Leave a review
                    </h3>
                    <p className="mt-1 max-w-sm text-[12px] leading-5 text-muted-foreground">
                      {status === "returned"
                        ? "Tell other adventurers what you thought of this gear."
                        : "Reviews unlock once your rental is marked as Returned by the provider."}
                    </p>
                  </div>
                  {showReviewButton ? (
                    <Button
                      size="sm"
                      onClick={() => setReviewOpen(true)}
                      className="shrink-0"
                    >
                      <StarIcon weight="bold" className="h-3.5 w-3.5" />
                      Leave a review
                    </Button>
                  ) : null}
                </div>
              </section>
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-card/60 p-5">
            <h2 className="text-sm font-semibold text-foreground">Summary</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Order #{shortId}</p>

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
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
                          status ? ORDER_STATUS_TONE[status] : "border-zinc-400/30 bg-zinc-500/10 text-zinc-300",
                        )}
                      >
                        {status ? ORDER_STATUS_LABELS[status] : "Unknown"}
                      </span>
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted-foreground">Dates</dt>
                    <dd className="text-right font-medium text-foreground">
                      {formatDateRange(order.startDate, order.endDate)}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted-foreground">Items</dt>
                    <dd className="text-right font-medium text-foreground">
                      {totalItems} item{totalItems === 1 ? "" : "s"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
                  <span className="text-sm font-medium text-muted-foreground">Total</span>
                  <span className="text-2xl font-semibold tracking-tight text-foreground">
                    {formatMoney(totalAmount)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Placed {formatDate(order.createdAt)}
                </p>

                {showPayNow ? (
                  <Button asChild size="lg" className="mt-4 w-full">
                    <Link href={`/dashboard/customer/orders/${order.id}/pay`}>
                      <CreditCardIcon weight="bold" className="h-4 w-4" />
                      Pay now
                    </Link>
                  </Button>
                ) : showReviewButton ? (
                  <Button
                    size="lg"
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => setReviewOpen(true)}
                  >
                    <StarIcon weight="bold" className="h-4 w-4" />
                    Leave a review
                  </Button>
                ) : null}

                {showCancel ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={cancelMutation.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Cancel this rental order? The gear will be released back to the provider.",
                          )
                        ) {
                          cancelMutation.mutate();
                        }
                      }}
                    >
                      <XCircleIcon weight="bold" className="h-3.5 w-3.5" />
                      {cancelMutation.isPending
                        ? "Cancelling…"
                        : "Cancel this order"}
                    </Button>
                    <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
                      Free to cancel until you pay.
                    </p>
                  </>
                ) : null}
              </>
            ) : null}
          </section>

          <section className="rounded-xl border border-border bg-card/60 p-5">
            <h3 className="text-sm font-semibold text-foreground">Payments</h3>
            {orderQuery.isPending ? (
              <div className="mt-3 space-y-2">
                <div className="h-10 animate-shimmer rounded-md" />
                <div className="h-10 animate-shimmer rounded-md" />
              </div>
            ) : !order ? null : order.payments && order.payments.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {order.payments.map((payment) => {
                  const statusKey = payment.status.toLowerCase();
                  const label = PAYMENT_STATUS_LABELS[statusKey] ?? payment.status;
                  const tone = PAYMENT_STATUS_TONE[statusKey];
                  const Icon = PAYMENT_STATUS_ICON[statusKey] ?? ReceiptIcon;
                  return (
                    <li
                      key={payment.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/20 px-3 py-2 text-[12px]"
                    >
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Icon
                          weight="duotone"
                          className={cn("h-3.5 w-3.5", tone?.split(" ")[1])}
                        />
                        <span className="uppercase tracking-wide">{payment.provider}</span>
                      </div>
                      <span
                        className={cn(
                          "rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
                          tone,
                        )}
                      >
                        {label}
                      </span>
                      <span className="tabular-nums font-semibold text-foreground">
                        {formatMoney(Number(payment.amount))}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-[12px] text-muted-foreground">
                No payments captured yet.
              </p>
            )}
          </section>

          {order ? <NextStepsCard order={order} /> : null}
        </aside>
      </div>

      {order ? (
        <ReviewModal
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          rentalOrderId={order.id}
          gearName={firstGear?.name}
          gearImage={firstGear?.images?.[0]}
          orderShortId={shortId}
        />
      ) : null}
    </DashboardShell>
  );
}

interface StatProps {
  icon: React.ComponentType<{
    weight?: "fill" | "duotone" | "regular" | "bold";
    className?: string;
  }>;
  label: string;
  value: string;
  hint?: string;
}

function Stat({ icon: Icon, label, value, hint }: StatProps) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        <Icon weight="duotone" className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1.5 truncate text-[13px] font-semibold text-foreground">{value}</p>
      {hint ? (
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function NextStepsCard({ order }: { order: RentalOrder }) {
  const cfg = NEXT_STEPS[order.status] ?? NEXT_STEPS.placed;
  const tone = NEXT_STEP_TONE[cfg.tone];
  const Icon = tone.icon;

  return (
    <section
      className={cn(
        "rounded-xl border bg-card/60 p-5",
        tone.border,
        tone.bg,
      )}
    >
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon weight="duotone" className={cn("h-4 w-4", tone.text)} />
        {cfg.title}
      </h3>
      <ol className="mt-3 space-y-2.5 text-[12px] text-muted-foreground">
        {cfg.steps.map((step, index) => (
          <li key={index} className="flex items-start gap-2">
            <span
              className={cn(
                "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border bg-background/40 text-[10px] font-semibold",
                tone.border,
                tone.text,
              )}
            >
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}
