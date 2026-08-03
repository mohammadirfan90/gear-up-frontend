"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  GearIcon,
  PackageIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  SpinnerGapIcon,
  UserCircleIcon,
  UsersIcon,
} from "@phosphor-icons/react/dist/ssr";
import { DashboardShell, type DashboardTab } from "@/components/DashboardShell";
import { Button } from "@/components/ui/Button";
import { AdminStats } from "@/components/AdminStats";
import { fetchAdminStats, fetchAdminUsers } from "@/shared/admin";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/shared/utils/cn";

const tabs: DashboardTab[] = [
  {
    label: "Overview",
    href: "/dashboard/admin",
    icon: ShoppingBagIcon,
    description: "Platform health and KPIs",
  },
  {
    label: "Users",
    href: "/dashboard/admin/users",
    icon: UsersIcon,
    description: "Manage accounts and roles",
  },
  {
    label: "Gear",
    href: "/dashboard/admin/gear",
    icon: PackageIcon,
    description: "Moderate listings",
  },
  {
    label: "Profile",
    href: "/dashboard/admin/profile",
    icon: UserCircleIcon,
    description: "Account settings",
  },
];

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

const STATUS_TONE: Record<string, string> = {
  active: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  suspended: "border-rose-400/30 bg-rose-500/10 text-rose-300",
};

const ROLE_TONE: Record<string, string> = {
  customer: "border-blue-400/30 bg-blue-500/10 text-blue-300",
  provider: "border-lime-400/30 bg-lime-400/10 text-lime-300",
  admin: "border-violet-400/30 bg-violet-500/10 text-violet-300",
};

export default function AdminDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const firstName = user?.name?.split(" ")[0] ?? "Admin";

  const statsQuery = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  });

  const usersQuery = useQuery({
    queryKey: ["admin-users", { limit: 5 }],
    queryFn: () => fetchAdminUsers({ limit: 5 }),
    enabled: isAuthenticated,
  });

  const stats = statsQuery.data;
  const recentUsers = usersQuery.data?.items ?? [];
  const isLoading = statsQuery.isPending;
  const generatedAt = stats?.generatedAt
    ? formatDate(stats.generatedAt)
    : "—";

  return (
    <DashboardShell
      eyebrow="Admin workspace"
      title={`Welcome back, ${firstName}.`}
      description="Monitor marketplace health, moderate listings, and act on platform signals."
      tabs={tabs}
      actions={
        <Button asChild variant="secondary" size="sm">
          <Link href="/dashboard/admin/users">
            Manage users
            <ArrowRightIcon weight="bold" className="h-3.5 w-3.5" />
          </Link>
        </Button>
      }
    >
      <AdminStats
        stats={
          stats ?? {
            users: { total: 0, customers: 0, providers: 0, suspended: 0 },
            gear: { total: 0, available: 0, unavailable: 0 },
            categories: { total: 0 },
            orders: { total: 0, active: 0, byStatus: {} },
            revenue: {
              completedTotal: 0,
              completedCount: 0,
              completedAverage: 0,
              pendingTotal: 0,
              pendingCount: 0,
              last30DaysTotal: 0,
              last30DaysCount: 0,
            },
            reviews: { total: 0, averageRating: 0 },
            topCustomers: [],
            generatedAt: new Date().toISOString(),
          }
        }
        isLoading={isLoading}
      />

      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-xl border border-border bg-card/60">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Recent users</h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Newest accounts across all roles
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/admin/users">
                All users
                <ArrowRightIcon weight="bold" className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          {usersQuery.isPending ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-12 animate-shimmer rounded-lg" />
              ))}
            </div>
          ) : usersQuery.isError ? (
            <div className="flex min-h-40 flex-col items-center justify-center px-6 text-center">
              <ClockCountdownIcon weight="duotone" className="mb-3 h-6 w-6 text-amber-300" />
              <p className="text-sm font-medium text-foreground">Unable to load users</p>
            </div>
          ) : recentUsers.length === 0 ? (
            <div className="flex min-h-40 flex-col items-center justify-center px-6 text-center">
              <UsersIcon weight="duotone" className="mb-3 h-7 w-7 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">No users yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-secondary/30"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-[11px] font-semibold text-foreground">
                      {user.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-foreground">
                        {user.name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={cn(
                        "rounded-md border px-2 py-1 text-[10px] font-semibold capitalize",
                        ROLE_TONE[user.role] ?? "border-border bg-secondary/40 text-muted-foreground",
                      )}
                    >
                      {user.role}
                    </span>
                    <span
                      className={cn(
                        "rounded-md border px-2 py-1 text-[10px] font-semibold capitalize",
                        STATUS_TONE[user.status] ?? "border-border bg-secondary/40 text-muted-foreground",
                      )}
                    >
                      {user.status}
                    </span>
                    <span className="hidden text-[11px] text-muted-foreground sm:inline">
                      {formatDate(user.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-card/60 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-lime-400/30 bg-lime-400/10 text-lime-300">
                <ShieldCheckIcon weight="duotone" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  System health
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  All systems operational
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-2.5 text-[12px] text-muted-foreground">
              <li className="flex items-center justify-between">
                <span>Auth API</span>
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <CheckCircleIcon weight="fill" className="h-3 w-3" />
                  Healthy
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Stripe webhooks</span>
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <CheckCircleIcon weight="fill" className="h-3 w-3" />
                  Listening
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Last refresh</span>
                <span className="inline-flex items-center gap-1 text-foreground">
                  <SpinnerGapIcon
                    weight="bold"
                    className={cn(
                      "h-3 w-3",
                      statsQuery.isRefetching ? "animate-spin text-lime-400" : "text-muted-foreground",
                    )}
                  />
                  {generatedAt}
                </span>
              </li>
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-card/60 p-5">
            <h3 className="text-sm font-semibold text-foreground">Quick actions</h3>
            <div className="mt-4 grid grid-cols-1 gap-2">
              <Button asChild variant="secondary" className="justify-between">
                <Link href="/dashboard/admin/users">
                  Manage users
                  <ArrowRightIcon weight="bold" className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild variant="secondary" className="justify-between">
                <Link href="/dashboard/admin/gear">
                  Moderate gear
                  <ArrowRightIcon weight="bold" className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-between">
                <Link href="/dashboard/admin/profile">
                  Account settings
                  <GearIcon weight="duotone" className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>
        </aside>
      </section>
    </DashboardShell>
  );
}
