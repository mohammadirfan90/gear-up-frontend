"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  FlagBannerIcon,
  ReceiptIcon,
  StorefrontIcon,
} from "@phosphor-icons/react/dist/ssr";
import { DashboardShell, type DashboardTab } from "@/components/DashboardShell";
import { Button } from "@/components/ui/Button";
import { ProviderOrdersTable } from "@/components/ProviderOrdersTable";

const tabs: DashboardTab[] = [
  {
    label: "Overview",
    href: "/dashboard/provider",
    icon: StorefrontIcon,
    description: "Inventory and rental activity",
  },
  {
    label: "Orders",
    href: "/dashboard/provider/orders",
    icon: ReceiptIcon,
    description: "Manage incoming orders",
  },
  {
    label: "Profile",
    href: "/dashboard/provider/profile",
    icon: FlagBannerIcon,
    description: "Account settings",
  },
];

export default function ProviderOrdersPage() {
  return (
    <DashboardShell
      eyebrow="Provider workspace"
      title="Incoming orders"
      description="Confirm rentals, mark pickups, and close out returns — all in one queue."
      tabs={tabs}
      actions={
        <Button asChild variant="secondary" size="sm">
          <Link href="/dashboard/provider">
            Back to inventory
            <ArrowRightIcon weight="bold" className="h-3.5 w-3.5" />
          </Link>
        </Button>
      }
    >
      <ProviderOrdersTable />
    </DashboardShell>
  );
}
