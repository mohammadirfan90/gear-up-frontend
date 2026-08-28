"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/Button";
import { UsersTable } from "@/components/UsersTable";
import { ADMIN_NAV_TABS } from "@/components/dashboards/adminNav";
import { useAuthStore } from "@/store/authStore";

export default function AdminUsersPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <DashboardShell
      eyebrow="Admin workspace"
      title="User management"
      description="Search accounts, update roles, and suspend or reactivate members."
      tabs={ADMIN_NAV_TABS}
      variant="sidebar"
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