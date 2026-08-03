"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/shared/utils/cn";

export interface DashboardTab {
  label: string;
  href: string;
  icon: React.ComponentType<{ weight?: "fill" | "duotone" | "regular" | "bold"; className?: string }>;
  description?: string;
  badge?: string | number;
}

interface DashboardShellProps {
  eyebrow: string;
  title: string;
  description: string;
  tabs: DashboardTab[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardShell({
  eyebrow,
  title,
  description,
  tabs,
  actions,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  return (
    <div className="container mx-auto max-w-7xl px-6 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-lime-400">
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

      <nav className="mt-8 flex flex-wrap items-center gap-1 rounded-xl border border-border glass-strong p-1.5">
        {tabs.map((tab) => {
          const active =
            tab.href === "/dashboard/customer" || tab.href === "/dashboard/provider" || tab.href === "/dashboard/admin"
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
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
                  active ? "text-lime-300" : "text-muted-foreground",
                )}
              />
              <span>{tab.label}</span>
              {tab.badge ? (
                <span className="ml-1 rounded-md border border-lime-400/40 bg-lime-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-lime-300">
                  {tab.badge}
                </span>
              ) : null}
              {active ? (
                <span className="absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-lime-300 via-lime-400 to-lime-600" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <CaretRightIcon weight="bold" className="h-2.5 w-2.5" />
          <Link href="/dashboard/customer" className="hover:text-foreground">Dashboard</Link>
          <CaretRightIcon weight="bold" className="h-2.5 w-2.5" />
          <span className="text-foreground">{tabs.find((tab) => tab.href === pathname || pathname.startsWith(tab.href))?.label ?? eyebrow}</span>
        </nav>
        {children}
      </div>
    </div>
  );
}

export default DashboardShell;
