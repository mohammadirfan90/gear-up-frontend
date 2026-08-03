"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  ReceiptIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { fetchRentalOrder } from "@/shared/rentals";

function PaymentSuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("order") ?? "";

  const orderQuery = useQuery({
    queryKey: ["rental-order-after-payment", orderId],
    queryFn: () => fetchRentalOrder(orderId),
    enabled: Boolean(orderId),
    refetchInterval: 3000,
  });

  const isSucceeded =
    orderQuery.data?.status === "paid" || orderQuery.data?.status === "picked_up";

  return (
    <div className="container mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 shadow-glow">
        {orderQuery.isPending ? (
          <SpinnerGapIcon weight="bold" className="h-7 w-7 animate-spin" />
        ) : (
          <CheckCircleIcon weight="duotone" className="h-9 w-9" />
        )}
      </span>

      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lime-400">
        Payment successful
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Gear is yours for the trip.
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
        {isSucceeded
          ? "Your payment has been confirmed. The provider will be notified and will prepare your gear for pickup."
          : "We’re confirming your payment with Stripe. Hang tight while we finalise the order."}
      </p>

      {orderQuery.data ? (
        <div className="mt-8 w-full max-w-md rounded-xl border border-border bg-card/60 p-5 text-left">
          <div className="flex items-center justify-between text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ReceiptIcon weight="duotone" className="h-3.5 w-3.5" />
              Order
            </span>
            <span className="font-medium text-foreground">
              #{orderQuery.data.id.slice(-8).toUpperCase()}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[12px] text-muted-foreground">
            <span>Total paid</span>
            <span className="font-semibold text-foreground">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(Number(orderQuery.data.totalAmount))}
            </span>
          </div>
        </div>
      ) : null}

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href={orderId ? `/dashboard/customer/orders/${orderId}` : "/dashboard/customer/orders"}>
            View order
            <ArrowRightIcon weight="bold" className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/dashboard/customer/payments">Go to payments</Link>
        </Button>
      </div>

      {orderQuery.isError ? (
        <p className="mt-6 inline-flex items-center gap-1.5 text-[11px] text-amber-300">
          <ClockCountdownIcon weight="bold" className="h-3 w-3" />
          We’re still verifying your payment. Refresh in a few seconds.
        </p>
      ) : null}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 py-16">
          <SpinnerGapIcon
            weight="bold"
            className="h-6 w-6 animate-spin text-lime-400"
          />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
