"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { DashboardShell } from "@/components/DashboardShell";
import { PROVIDER_NAV_TABS } from "@/components/dashboards/providerNav";
import { Button } from "@/components/ui/Button";
import { ProviderOrdersTable } from "@/components/ProviderOrdersTable";

export default function ProviderOrdersPage() {
  return (
    <DashboardShell
      eyebrow="Provider workspace"
      title="Incoming orders"
      description=""
      tabs={PROVIDER_NAV_TABS}
      variant="sidebar"
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
