"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  CalendarBlankIcon,
  PackageIcon,
  ReceiptIcon,
  UserCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { DashboardShell, type DashboardTab } from "@/components/DashboardShell";
import { Button } from "@/components/ui/Button";
import { OrdersTable } from "@/components/OrdersTable";

const tabs: DashboardTab[] = [
  {
    label: "Overview",
    href: "/dashboard/customer",
    icon: CalendarBlankIcon,
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
    icon: ReceiptIcon,
    description: "Invoices and transactions",
  },
  {
    label: "Profile",
    href: "/dashboard/customer/profile",
    icon: UserCircleIcon,
    description: "Personal settings",
  },
];

export default function CustomerOrdersPage() {
  return (
    <DashboardShell
      eyebrow="Customer workspace"
      title="Orders"
      description="Browse and manage every rental you've placed."
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
      <OrdersTable />
    </DashboardShell>
  );
}
