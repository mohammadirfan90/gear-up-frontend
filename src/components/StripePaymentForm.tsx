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
import { useTheme } from "next-themes";
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
import { createPaymentIntent, syncPaymentStatus } from "@/shared/paymentClient";
import { getApiErrorMessage } from "@/shared/apiError";

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

const DARK_APPEARANCE = {
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

const LIGHT_APPEARANCE = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#487f17",
    colorBackground: "#ffffff",
    colorText: "#0a0a0a",
    colorDanger: "#dc2626",
    colorTextSecondary: "#52525b",
    colorTextPlaceholder: "#a1a1aa",
    borderRadius: "10px",
    fontFamily: "Inter, system-ui, sans-serif",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid #e4e4e7",
      backgroundColor: "#fafafa",
    },
    ".Input:focus": {
      borderColor: "#487f17",
      boxShadow: "0 0 0 1px #487f17",
    },
    ".Label": {
      color: "#52525b",
      fontWeight: "500",
      fontSize: "12px",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
    },
    ".Tab": {
      backgroundColor: "#fafafa",
      border: "1px solid #e4e4e7",
    },
    ".Tab--selected": {
      backgroundColor: "#f4f4f5",
      borderColor: "#487f17",
      color: "#0a0a0a",
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
  const { resolvedTheme } = useTheme();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const appearance = resolvedTheme === "light" ? LIGHT_APPEARANCE : DARK_APPEARANCE;

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
        setIntentError(
          getApiErrorMessage(
            error,
            "Unable to initialize payment. Please try again.",
          ),
        );
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
            <SpinnerGapIcon weight="bold" className="h-4 w-4 animate-spin text-emerald-500 dark:text-emerald-400" />
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
      key={resolvedTheme ?? "dark"}
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance,
        loader: "auto",
      }}
    >
      <CheckoutInner
        key={clientSecret}
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
  paymentId,
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
  const [elementReady, setElementReady] = useState(false);

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
    if (!stripe || !elements || !elementReady) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
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
        // Send declines and abandoned confirmations to the cancel page so the
        // customer gets the retry path rather than a success screen.
        router.push(
          `/payment/cancel?order=${rentalOrderId}&reason=${
            error.type === "card_error" ? "failed" : "requires_payment_method"
          }`,
        );
        return;
      }

      if (!paymentIntent) {
        // No error and no intent means Stripe handed the flow off to a
        // redirect; the return_url takes over from here.
        return;
      }

      // A PaymentIntent comes back for `processing` and `requires_*` states
      // too — only `succeeded` means the money actually moved.
      if (paymentIntent.status !== "succeeded") {
        if (paymentIntent.status === "processing") {
          toast.success("Payment submitted — awaiting confirmation");
          onSuccess?.();
          router.push(
            `/payment/success?order=${rentalOrderId}&intent=${paymentIntent.id}&redirect_status=processing`,
          );
          return;
        }

        const message =
          "Your payment needs another step before it can be completed.";
        setErrorMessage(message);
        toast.error(message);
        setIsProcessing(false);
        router.push(
          `/payment/cancel?order=${rentalOrderId}&reason=requires_payment_method`,
        );
        return;
      }

      // The webhook is what flips the order to `paid`, but it can lag or be
      // unconfigured. Nudge the server to reconcile against Stripe now so the
      // success page doesn't poll a status that never changes.
      if (paymentId) {
        try {
          await syncPaymentStatus(paymentId);
        } catch {
          // Non-fatal — the success page keeps polling and the webhook will
          // settle it either way.
        }
      }

      toast.success("Payment confirmed");
      onSuccess?.();
      router.push(`/payment/success?order=${rentalOrderId}&intent=${paymentIntent.id}`);
    } catch (err) {
      const message = getApiErrorMessage(
        err,
        "An unexpected error occurred while processing your payment.",
      );
      setErrorMessage(message);
      toast.error(message);
      setIsProcessing(false);
    }
  };

  const canSubmit = Boolean(stripe && elements && elementReady) && !isProcessing;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-border bg-card/60 p-5">
        <div className="mb-4 flex items-center justify-between text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <LockKeyIcon weight="duotone" className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            Encrypted and processed by Stripe
          </span>
          <span>Order #{orderShortId}</span>
        </div>
        <PaymentElement
          options={{ layout: "tabs" }}
          onReady={() => setElementReady(true)}
          onChange={(event) => {
            // Stripe can flip element back to incomplete on validation errors;
            // gate submit on elementReady *and* the event's complete state so
            // we never submit with an empty card field.
            if (event.complete) setElementReady(true);
          }}
        />
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
        ) : !elementReady ? (
          <>
            <SpinnerGapIcon weight="bold" className="h-4 w-4 animate-spin" />
            Loading secure checkout…
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
          <CheckCircleIcon weight="fill" className="h-3 w-3 text-emerald-400" />
          Funds held until pickup
        </span>
        <span className="inline-flex items-center gap-1">
          <LockKeyIcon weight="fill" className="h-3 w-3 text-emerald-400" />
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
