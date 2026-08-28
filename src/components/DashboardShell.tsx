"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { WorkspaceTopBar } from "@/components/WorkspaceTopBar";
import type { UserRole } from "@/store/authStore";
import { cn } from "@/shared/utils/cn";

export interface DashboardTab {
  label: string;
  href: string;
  icon: React.ComponentType<{
    weight?: "fill" | "duotone" | "regular" | "bold";
    className?: string;
  }>;
  description?: string;
  badge?: string | number;
}

interface DashboardShellProps {
  eyebrow: string;
  title: string;
  description?: string;
  tabs: DashboardTab[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  variant?: "toolbar" | "sidebar";
}

const deriveRole = (tabs: DashboardTab[]): UserRole => {
  const root = tabs[0]?.href ?? "";
  if (root.startsWith("/dashboard/admin")) return "admin";
  if (root.startsWith("/dashboard/provider")) return "provider";
  return "customer";
};

export function DashboardShell({
  eyebrow,
  title,
  description,
  tabs,
  actions,
  children,
  variant = "toolbar",
}: DashboardShellProps) {
  const pathname = usePathname();
  const rootHref = tabs[0]?.href ?? "/dashboard";
  const isSidebar = variant === "sidebar";
  const [collapsed, setCollapsed] = useState(false);

  const role = deriveRole(tabs);

  return (
    <div className={cn("flex w-full flex-col", isSidebar && "lg:flex-row")}>
      {isSidebar ? (
        <DashboardSidebar
          tabs={tabs}
          eyebrow={eyebrow}
          role={role}
          defaultCollapsed={collapsed}
          onCollapsedChange={setCollapsed}
        />
      ) : null}

      <div
        className={cn(
          "flex min-h-screen flex-1 flex-col",
          isSidebar && "lg:pl-64",
          isSidebar && collapsed && "lg:pl-20",
        )}
      >
        {isSidebar ? (
          <WorkspaceTopBar
            tabs={tabs}
            eyebrow={eyebrow}
            publicPageHref="/"
          />
        ) : null}

        <div
          className={cn(
            "flex flex-1 flex-col",
            isSidebar
              ? "px-4 py-6 sm:px-8 sm:py-8"
              : "container mx-auto max-w-7xl px-6 py-10 sm:py-14",
          )}
        >
          {isSidebar ? (
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                  {eyebrow}
                </p>
                <h1 className="mt-2 truncate text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {title}
                </h1>
                {description ? (
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                ) : null}
              </div>
              {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                    {eyebrow}
                  </p>
                  <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                    {title}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                    {description}
                  </p>
                </div>
                {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
              </div>
              <ToolbarTabs tabs={tabs} pathname={pathname} rootHref={rootHref} />
            </>
          )}

          <div className={cn(isSidebar ? "flex-1" : "mt-8")}>{children}</div>
        </div>
      </div>
    </div>
  );
}

function ToolbarTabs({
  tabs,
  pathname,
  rootHref,
}: {
  tabs: DashboardTab[];
  pathname: string;
  rootHref: string;
}) {
  return (
    <nav className="mt-8 flex flex-wrap items-center gap-1 rounded-xl border border-border glass-strong p-1.5">
      {tabs.map((tab) => {
        const active =
          tab.href === rootHref ? pathname === tab.href : pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <a
            key={tab.href}
            href={tab.href}
            className={cn(
              "group relative inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-[13px] font-medium transition-colors",
              active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon
              weight={active ? "fill" : "duotone"}
              className={cn(
                "h-4 w-4",
                active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
              )}
            />
            <span>{tab.label}</span>
            {tab.badge ? (
              <span className="ml-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                {tab.badge}
              </span>
            ) : null}
            {active ? (
              <span className="absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600" />
            ) : null}
          </a>
        );
      })}
    </nav>
  );
}

export default DashboardShell;