"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  PackageIcon,
  ReceiptIcon,
  ShoppingBagOpenIcon,
  UserCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { DashboardShell, type DashboardTab } from "@/components/DashboardShell";
import { Button } from "@/components/ui/Button";
import api, { type ApiEnvelope } from "@/shared/api";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE } from "@/shared/order";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/shared/utils/cn";

interface DashboardOrder {
  id: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: "placed" | "confirmed" | "paid" | "picked_up" | "returned" | "cancelled";
  createdAt: string;
  items: { id: string; quantity: number; pricePerDay: number; subtotal: number }[];
}

interface OrderListResult {
  items: DashboardOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const tabs: DashboardTab[] = [
  {
    label: "Overview",
    href: "/dashboard/customer",
    icon: ShoppingBagOpenIcon,
    description: "Rental activity at a glance",
  },
  {
    label: "Orders",
    href: "/dashboard/customer/orders",
    icon: PackageIcon,
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

const fetchOrders = async (): Promise<DashboardOrder[]> => {
  const { data } = await api.get<ApiEnvelope<OrderListResult>>("/rentals?limit=100");
  return data.data.items ?? [];
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatDateRange = (start: string, end: string) => {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  return `${formatter.format(new Date(start))} – ${formatter.format(new Date(end))}`;
};

export default function CustomerDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const ordersQuery = useQuery({
    queryKey: ["customer-orders", "overview"],
    queryFn: fetchOrders,
    enabled: isAuthenticated,
  });

  const orders = ordersQuery.data ?? [];
  const activeRentals = orders.filter((order) =>
    ["paid", "picked_up"].includes(order.status),
  ).length;
  const completedRentals = orders.filter((order) => order.status === "returned").length;
  const pendingPayments = orders.filter((order) => order.status === "confirmed");
  const pendingAmount = pendingPayments.reduce(
    (sum, order) => sum + Number(order.totalAmount),
    0,
  );
  const recentOrders = orders.slice(0, 4);

  const metrics = [
    {
      label: "Active rentals",
      value: activeRentals,
      description: "Paid or currently picked up",
      icon: CalendarBlankIcon,
      tone: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
    },
    {
      label: "Completed rentals",
      value: completedRentals,
      description: "Successfully returned",
      icon: CheckCircleIcon,
      tone: "text-blue-300 bg-blue-400/10 border-blue-400/20",
    },
    {
      label: "Pending payments",
      value: pendingPayments.length,
      detail: pendingAmount > 0 ? formatMoney(pendingAmount) : undefined,
      description: "Confirmed and ready to pay",
      icon: CurrencyDollarIcon,
      tone: "text-amber-300 bg-amber-400/10 border-amber-400/20",
    },
  ];

  return (
    <DashboardShell
      eyebrow="Customer workspace"
      title={`Good to see you, ${firstName}.`}
      tabs={tabs}
      actions={
        <Button asChild variant="secondary" size="sm">
          <Link href="/gear">
            Browse gear
            <ArrowRightIcon weight="bold" className="h-3.5 w-3.5" />
          </Link>
        </Button>
      }
    >
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {metrics.map(({ label, value, detail, description, icon: Icon, tone }) => (
          <article
            key={label}
            className="group relative overflow-hidden rounded-xl border border-border bg-card/60 p-5 shadow-elevated transition-colors hover:border-emerald-500/30"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {label}
                </p>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-semibold tracking-tight text-foreground">
                    {ordersQuery.isPending ? "—" : value}
                  </span>
                  {detail ? (
                    <span className="mb-1 text-sm font-medium text-muted-foreground">
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
            <div className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-emerald-400 to-transparent transition-transform duration-300 group-hover:scale-x-100" />
          </article>
        ))}
      </section>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-xl border border-border bg-card/60">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Recent rentals</h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Your latest booking activity
              </p>
            </div>
            <Link
              href="/dashboard/customer/orders"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground"
            >
              View all
              <ArrowRightIcon weight="bold" className="h-3 w-3" />
            </Link>
          </div>

          {ordersQuery.isPending ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-16 animate-shimmer rounded-lg" />
              ))}
            </div>
          ) : ordersQuery.isError ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
              <ClockCountdownIcon weight="duotone" className="mb-3 h-7 w-7 text-amber-300" />
              <p className="text-sm font-medium text-foreground">Unable to load your rentals</p>
              <button
                type="button"
                onClick={() => ordersQuery.refetch()}
                className="mt-3 text-[12px] font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Try again
              </button>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
              <PackageIcon weight="duotone" className="mb-3 h-7 w-7 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">No rentals yet</p>
              <p className="mt-1 max-w-xs text-[12px] leading-5 text-muted-foreground">
                Find your next adventure-ready piece of gear and place your first rental.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/gear">Explore gear</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/customer/orders/${order.id}`}
                  className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-secondary/30"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground">
                      <ReceiptIcon weight="duotone" className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-foreground">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatDateRange(order.startDate, order.endDate)} · {order.items.length} item{order.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden text-[13px] font-medium text-foreground sm:block">
                      {formatMoney(Number(order.totalAmount))}
                    </span>
                    <span
                      className={cn(
                        "rounded-md border px-2 py-1 text-[10px] font-semibold",
                        ORDER_STATUS_TONE[order.status],
                      )}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-card/60 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-sm font-semibold text-white shadow-glow">
                {(user?.name ?? "GU")
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user?.name ?? "GearUp customer"}
                </p>
                <p className="truncate text-[12px] text-muted-foreground">
                  {user?.email ?? "Complete your profile"}
                </p>
              </div>
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">Account status</span>
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <CheckCircleIcon weight="fill" className="h-3 w-3" />
                  {user?.status ?? "active"}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">Role</span>
                <span className="capitalize text-foreground">{user?.role ?? "customer"}</span>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="mt-5 w-full">
              <Link href="/dashboard/customer/profile">Manage profile</Link>
            </Button>
          </section>

          {pendingPayments.length > 0 ? (
            <section className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-5">
              <CurrencyDollarIcon weight="duotone" className="h-5 w-5 text-amber-300" />
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                Payment required
              </h3>
              <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                {pendingPayments.length} confirmed order{pendingPayments.length === 1 ? " is" : "s are"} waiting for payment.
              </p>
              <Button asChild size="sm" className="mt-4 w-full">
                <Link href={`/dashboard/customer/orders/${pendingPayments[0].id}/pay`}>
                  Pay {formatMoney(Number(pendingPayments[0].totalAmount))}
                  <ArrowRightIcon weight="bold" className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </section>
          ) : null}
        </aside>
      </div>
    </DashboardShell>
  );
}
