"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeftIcon,
  SpinnerGapIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";

function PaymentCancelContent() {
  const params = useSearchParams();
  const orderId = params.get("order") ?? "";

  return (
    <div className="container mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10 text-amber-300">
        <WarningCircleIcon weight="duotone" className="h-8 w-8" />
      </span>

      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
        Payment cancelled
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        No worries — nothing was charged.
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
        You can return to checkout to finish your payment, or browse more gear
        while you decide.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link
            href={
              orderId
                ? `/dashboard/customer/orders/${orderId}/pay`
                : "/dashboard/customer/orders"
            }
          >
            Try payment again
          </Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/gear">
            <ArrowLeftIcon weight="bold" className="h-3.5 w-3.5" />
            Back to gear
          </Link>
        </Button>
      </div>
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
            className="h-6 w-6 animate-spin text-lime-400"
          />
        </div>
      }
    >
      <PaymentCancelContent />
    </Suspense>
  );
}
