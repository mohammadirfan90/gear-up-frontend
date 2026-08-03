"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  BankIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ReceiptIcon,
  WarningCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/shared/utils/cn";
import {
  fetchPayments,
  PAYMENT_PROVIDER_LABELS,
  type PaymentListItem,
  type PaymentListResult,
} from "@/shared/payments";
import { PAYMENT_STATUS_TONE } from "@/shared/order";

interface PaymentsTableProps {
  initialData?: PaymentListResult;
  limit?: number;
}

const PAYMENT_STATUS_LABELS: Record<PaymentListItem["status"], string> = {
  pending: "Pending",
  completed: "Succeeded",
  failed: "Failed",
  refunded: "Refunded",
};

type FilterKey = "all" | PaymentListItem["status"];

const filterLabels: Record<FilterKey, string> = {
  all: "All payments",
  pending: "Pending",
  completed: "Succeeded",
  failed: "Failed",
  refunded: "Refunded",
};

const STATUS_ICON: Record<PaymentListItem["status"], React.ComponentType<{ weight?: "fill" | "duotone" | "regular" | "bold"; className?: string }>> = {
  pending: ClockCountdownIcon,
  completed: CheckCircleIcon,
  failed: XCircleIcon,
  refunded: ReceiptIcon,
};

const fetchPaymentsQuery = async (limit: number): Promise<PaymentListResult> =>
  fetchPayments({ limit });

const formatMoney = (value: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

export function PaymentsTable({ initialData, limit = 50 }: PaymentsTableProps) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const paymentsQuery = useQuery({
    queryKey: ["customer-payments", limit],
    queryFn: () => fetchPaymentsQuery(limit),
    initialData,
    refetchOnMount: initialData ? false : true,
  });

  const items = paymentsQuery.data?.items ?? [];
  const total = paymentsQuery.data?.pagination?.total ?? items.length;
  const filtered =
    filter === "all" ? items : items.filter((item) => item.status === filter);

  const counts: Record<FilterKey, number> = {
    all: total,
    pending: items.filter((item) => item.status === "pending").length,
    completed: items.filter((item) => item.status === "completed").length,
    failed: items.filter((item) => item.status === "failed").length,
    refunded: items.filter((item) => item.status === "refunded").length,
  };

  const totals = items.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + Number(item.amount);
      return acc;
    },
    {} as Record<PaymentListItem["status"], number>,
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryStat
          label="Total charged"
          value={formatMoney((totals.completed ?? 0) + (totals.pending ?? 0), "USD")}
          description="Successful and pending payments"
          icon={CurrencyDollarIcon}
          tone="text-emerald-300 bg-emerald-400/10 border-emerald-400/20"
        />
        <SummaryStat
          label="Pending"
          value={String(counts.pending)}
          detail={totals.pending ? formatMoney(totals.pending, "USD") : undefined}
          description="Awaiting confirmation"
          icon={ClockCountdownIcon}
          tone="text-amber-300 bg-amber-400/10 border-amber-400/20"
        />
        <SummaryStat
          label="Failed"
          value={String(counts.failed)}
          description="Requires attention"
          icon={WarningCircleIcon}
          tone="text-rose-300 bg-rose-400/10 border-rose-400/20"
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card/60">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Payment history</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {total} transaction{total === 1 ? "" : "s"} on file
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-secondary/30 p-1">
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

        {paymentsQuery.isPending ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-14 animate-shimmer rounded-lg" />
            ))}
          </div>
        ) : paymentsQuery.isError ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <ClockCountdownIcon weight="duotone" className="mb-3 h-7 w-7 text-amber-300" />
            <p className="text-sm font-medium text-foreground">Unable to load payments</p>
            <button
              type="button"
              onClick={() => paymentsQuery.refetch()}
              className="mt-3 text-[12px] font-medium text-lime-300 hover:text-lime-200"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <CreditCardIcon weight="duotone" className="mb-3 h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              {items.length === 0 ? "No payments yet" : "No matching payments"}
            </p>
            <p className="mt-1 max-w-xs text-[12px] leading-5 text-muted-foreground">
              {items.length === 0
                ? "Your transaction history will appear here after your first rental."
                : "Try a different filter to see more transactions."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,1fr)_140px_140px_140px_120px] gap-4 border-b border-border bg-secondary/20 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground md:grid">
              <span>Transaction</span>
              <span>Order</span>
              <span>Provider</span>
              <span>Amount</span>
              <span className="text-right">Status</span>
            </div>

            <div className="divide-y divide-border">
              {filtered.map((payment) => (
                <PaymentRow key={payment.id} payment={payment} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function PaymentRow({ payment }: { payment: PaymentListItem }) {
  const StatusIcon = STATUS_ICON[payment.status];
  const shortTxn = payment.transactionId.slice(-10).toUpperCase();
  const dateLabel = payment.paidAt ?? payment.createdAt;

  return (
    <article className="group flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-secondary/30 md:grid md:grid-cols-[minmax(0,1fr)_140px_140px_140px_120px] md:items-center md:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
            PAYMENT_STATUS_TONE[payment.status],
          )}
        >
          <StatusIcon weight="duotone" className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-foreground">
            {shortTxn}
          </p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <CalendarBlankIcon weight="duotone" className="h-3 w-3" />
            {formatDate(dateLabel)}
          </p>
        </div>
      </div>

      <Link
        href={`/dashboard/customer/orders/${payment.rentalOrder.id}`}
        className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"
      >
        <ReceiptIcon weight="duotone" className="h-3.5 w-3.5" />
        #{payment.rentalOrder.id.slice(-8).toUpperCase()}
        <ArrowRightIcon weight="bold" className="h-2.5 w-2.5" />
      </Link>

      <div className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <BankIcon weight="duotone" className="h-3.5 w-3.5" />
        {PAYMENT_PROVIDER_LABELS[payment.provider]}
      </div>

      <div className="text-[13px] font-semibold tabular-nums text-foreground">
        {formatMoney(Number(payment.amount), payment.currency)}
      </div>

      <div className="flex justify-start md:justify-end">
        <span
          className={cn(
            "rounded-md border px-2 py-1 text-[10px] font-semibold",
            PAYMENT_STATUS_TONE[payment.status],
          )}
        >
          {PAYMENT_STATUS_LABELS[payment.status]}
        </span>
      </div>
    </article>
  );
}

function SummaryStat({
  label,
  value,
  detail,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  description: string;
  icon: React.ComponentType<{ weight?: "fill" | "duotone" | "regular" | "bold"; className?: string }>;
  tone: string;
}) {
  return (
    <article className="rounded-xl border border-border bg-card/60 p-5 shadow-elevated">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            {label}
          </p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-3xl font-semibold tracking-tight text-foreground">
              {value}
            </span>
            {detail ? (
              <span className="mb-1 text-[12px] font-medium text-muted-foreground">
                · {detail}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-[12px] text-muted-foreground">{description}</p>
        </div>
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg border", tone)}>
          <Icon weight="duotone" className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

export default PaymentsTable;