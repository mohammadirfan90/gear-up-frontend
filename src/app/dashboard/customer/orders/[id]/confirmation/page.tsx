"use client";

import { Suspense } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";

function ConfirmationContent({
  orderId,
}: {
  orderId: string;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;
    const paymentIntent = params.get("payment_intent");
    const redirectStatus = params.get("redirect_status");

    const query = new URLSearchParams();
    query.set("order", orderId);
    if (paymentIntent) query.set("intent", paymentIntent);

    redirected.current = true;

    // Stripe returns redirect_status = succeeded | pending | failed. Only the
    // first two belong on the success page — routing a failure there showed
    // the customer "Payment succeeded" for a payment that never happened.
    if (redirectStatus === "failed") {
      query.set("reason", "failed");
      router.replace(`/payment/cancel?${query.toString()}`);
      return;
    }

    if (redirectStatus) query.set("redirect_status", redirectStatus);
    router.replace(`/payment/success?${query.toString()}`);
  }, [params, orderId, router]);

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <SpinnerGapIcon
        weight="bold"
        className="h-8 w-8 animate-spin text-emerald-500 dark:text-emerald-400"
      />
      <p className="mt-4 text-sm font-medium text-foreground">
        Finalising your payment…
      </p>
      <p className="mt-1 text-[12px] text-muted-foreground">
        You’ll be redirected to the confirmation page in a moment.
      </p>
      <Button asChild variant="ghost" size="sm" className="mt-6">
        <Link href={`/dashboard/customer/orders/${orderId}`}>
          View order <ArrowRightIcon weight="bold" className="h-3 w-3" />
        </Link>
      </Button>
      <span className="mt-8 inline-flex items-center gap-1.5 text-[11px] text-emerald-300">
        <CheckCircleIcon weight="fill" className="h-3 w-3" />
        No further action needed
      </span>
    </div>
  );
}

interface ConfirmationPageProps {
  params: Promise<{ id: string }>;
}

export default function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { id } = use(params);
  return (
    <Suspense
      fallback={
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center">
          <SpinnerGapIcon
            weight="bold"
            className="h-6 w-6 animate-spin text-emerald-500 dark:text-emerald-400"
          />
        </div>
      }
    >
      <ConfirmationContent orderId={id} />
    </Suspense>
  );
}
