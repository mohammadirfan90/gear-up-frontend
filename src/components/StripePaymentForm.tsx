"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import toast from "react-hot-toast";
import {
  CheckCircleIcon,
  CreditCardIcon,
  LockKeyIcon,
  SpinnerGapIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { cn } from "@/shared/utils/cn";
import { createPaymentIntent } from "@/shared/paymentClient";

const STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

const stripePromise: Promise<Stripe | null> | null = STRIPE_PUBLISHABLE_KEY
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;

interface StripePaymentFormProps {
  rentalOrderId: string;
  amount: number;
  currency?: string;
  orderShortId: string;
  onSuccess?: () => void;
}

const appearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#99ea48",
    colorBackground: "#09090b",
    colorText: "#fafafa",
    colorDanger: "#ef4444",
    colorTextSecondary: "#a1a1aa",
    colorTextPlaceholder: "#71717a",
    borderRadius: "10px",
    fontFamily: "Inter, system-ui, sans-serif",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid #1f1f23",
      backgroundColor: "#0c0c10",
    },
    ".Input:focus": {
      borderColor: "#99ea48",
      boxShadow: "0 0 0 1px #99ea48",
    },
    ".Label": {
      color: "#a1a1aa",
      fontWeight: "500",
      fontSize: "12px",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
    },
    ".Tab": {
      backgroundColor: "#0c0c10",
      border: "1px solid #1f1f23",
    },
    ".Tab--selected": {
      backgroundColor: "#111114",
      borderColor: "#99ea48",
      color: "#fafafa",
    },
  },
};

export function StripePaymentForm({
  rentalOrderId,
  amount,
  currency = "USD",
  orderShortId,
  onSuccess,
}: StripePaymentFormProps) {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIntentError(null);
    setClientSecret(null);
    setPaymentId(null);

    if (!stripePromise) {
      setIntentError(
        "Stripe is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable payments.",
      );
      return;
    }

    createPaymentIntent(rentalOrderId)
      .then((result) => {
        if (cancelled) return;
        setClientSecret(result.clientSecret);
        setPaymentId(result.paymentId);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message =
          error instanceof Error
            ? error.message
            : "Unable to initialize payment. Please try again.";
        setIntentError(message);
      });

    return () => {
      cancelled = true;
    };
  }, [rentalOrderId]);

  if (intentError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <div className="flex items-start gap-3">
          <WarningCircleIcon
            weight="duotone"
            className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
          />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Payment setup failed
            </p>
            <p className="mt-1 text-[13px] leading-6 text-muted-foreground">
              {intentError}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              onClick={() => {
                setIntentError(null);
                router.refresh();
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret || !stripePromise) {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-card/60 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
            <SpinnerGapIcon weight="bold" className="h-4 w-4 animate-spin text-lime-400" />
            Preparing secure checkout…
          </div>
          <span className="text-[11px] text-muted-foreground">Order #{orderShortId}</span>
        </div>
        <div className="h-44 animate-shimmer rounded-lg" />
        <div className="h-12 animate-shimmer rounded-lg" />
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance,
        loader: "auto",
      }}
    >
      <CheckoutInner
        rentalOrderId={rentalOrderId}
        paymentId={paymentId}
        amount={amount}
        currency={currency}
        orderShortId={orderShortId}
        onSuccess={onSuccess}
        router={router}
      />
    </Elements>
  );
}

function CheckoutInner({
  rentalOrderId,
  amount,
  currency,
  orderShortId,
  onSuccess,
  router,
}: {
  rentalOrderId: string;
  paymentId: string | null;
  amount: number;
  currency: string;
  orderShortId: string;
  onSuccess?: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formattedAmount = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
      }).format(amount),
    [amount, currency],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/customer/orders/${rentalOrderId}/confirmation`,
      },
    });

    if (error) {
      const message =
        error.type === "card_error" || error.type === "validation_error"
          ? error.message ?? "Your payment could not be completed."
          : "An unexpected error occurred while processing your payment.";
      setErrorMessage(message);
      toast.error(message);
      setIsProcessing(false);
      return;
    }

    if (paymentIntent) {
      toast.success("Payment confirmed");
      onSuccess?.();
      router.push(`/payment/success?order=${rentalOrderId}&intent=${paymentIntent.id}`);
    }
  };

  const canSubmit = Boolean(stripe && elements) && !isProcessing;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-border bg-card/60 p-5">
        <div className="mb-4 flex items-center justify-between text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <LockKeyIcon weight="duotone" className="h-4 w-4 text-lime-400" />
            Encrypted and processed by Stripe
          </span>
          <span>Order #{orderShortId}</span>
        </div>
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {errorMessage ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">
          <WarningCircleIcon weight="duotone" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!canSubmit}
      >
        {isProcessing ? (
          <>
            <SpinnerGapIcon weight="bold" className="h-4 w-4 animate-spin" />
            Processing payment…
          </>
        ) : (
          <>
            <CreditCardIcon weight="bold" className="h-4 w-4" />
            Pay {formattedAmount} securely
          </>
        )}
      </Button>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CheckCircleIcon weight="fill" className="h-3 w-3 text-emerald-300" />
          Funds held until pickup
        </span>
        <span className="inline-flex items-center gap-1">
          <LockKeyIcon weight="fill" className="h-3 w-3 text-lime-300" />
          PCI-DSS compliant
        </span>
      </div>
    </form>
  );
}

interface PaymentStatusProps {
  state: "processing" | "succeeded" | "requires_action" | "failed";
  message?: string;
  orderId?: string;
}

export function PaymentStatusBanner({ state, message, orderId }: PaymentStatusProps) {
  const tone = {
    processing: "border-blue-400/30 bg-blue-500/5 text-blue-200",
    succeeded: "border-emerald-400/30 bg-emerald-500/5 text-emerald-200",
    requires_action: "border-amber-400/30 bg-amber-500/5 text-amber-200",
    failed: "border-destructive/30 bg-destructive/5 text-destructive",
  }[state];

  const Icon = {
    processing: SpinnerGapIcon,
    succeeded: CheckCircleIcon,
    requires_action: WarningCircleIcon,
    failed: WarningCircleIcon,
  }[state];

  return (
    <div className={cn("flex items-start gap-3 rounded-lg border px-4 py-3", tone)}>
      <Icon
        weight={state === "processing" ? "bold" : "duotone"}
        className={cn(
          "mt-0.5 h-5 w-5 shrink-0",
          state === "processing" && "animate-spin",
        )}
      />
      <div>
        <p className="text-[13px] font-medium capitalize text-foreground">
          {state.replace("_", " ")}
          {orderId ? <span className="ml-2 text-muted-foreground">#{orderId.slice(-8).toUpperCase()}</span> : null}
        </p>
        {message ? (
          <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{message}</p>
        ) : null}
      </div>
    </div>
  );
}

export default StripePaymentForm;
