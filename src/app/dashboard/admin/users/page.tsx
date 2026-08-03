"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  PackageIcon,
  ReceiptIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  UsersIcon,
} from "@phosphor-icons/react/dist/ssr";
import { DashboardShell, type DashboardTab } from "@/components/DashboardShell";
import { Button } from "@/components/ui/Button";
import { UsersTable } from "@/components/UsersTable";
import { useAuthStore } from "@/store/authStore";

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
    label: "Rentals",
    href: "/dashboard/admin/rentals",
    icon: PackageIcon,
    description: "Audit rentals and transactions",
  },
  {
    label: "Gear",
    href: "/dashboard/admin/gear",
    icon: ReceiptIcon,
    description: "Moderate listings",
  },
  {
    label: "Profile",
    href: "/dashboard/admin/profile",
    icon: UserCircleIcon,
    description: "Account settings",
  },
];

export default function AdminUsersPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <DashboardShell
      eyebrow="Admin workspace"
      title="User management"
      description="Search accounts, update roles, and suspend or reactivate members."
      tabs={tabs}
      actions={
        <Button asChild variant="secondary" size="sm">
          <Link href="/dashboard/admin">
            Back to overview
            <ArrowRightIcon weight="bold" className="h-3.5 w-3.5" />
          </Link>
        </Button>
      }
    >
      <UsersTable currentUserId={user?.id} />
    </DashboardShell>
  );
}