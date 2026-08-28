"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  CaretLeftIcon,
  CaretRightIcon,
  GearIcon,
  SignOutIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { DashboardTab } from "@/components/DashboardShell";
import { SIDEBAR_DRAWER_EVENT } from "@/components/WorkspaceTopBar";
import { useAuthStore, type UserRole } from "@/store/authStore";
import { cn } from "@/shared/utils/cn";

const COLLAPSED_KEY = "gearup-sidebar-collapsed";

interface DashboardSidebarProps {
  tabs: DashboardTab[];
  eyebrow: string;
  role: UserRole;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const isTabActive = (pathname: string, tab: DashboardTab, rootHref: string) =>
  tab.href === rootHref ? pathname === tab.href : pathname.startsWith(tab.href);

const roleAccent: Record<UserRole, string> = {
  customer: "text-emerald-600 dark:text-emerald-400",
  provider: "text-emerald-600 dark:text-emerald-400",
  admin: "text-emerald-600 dark:text-emerald-400",
};

const roleDashboard: Record<UserRole, string> = {
  customer: "/dashboard/customer",
  provider: "/dashboard/provider",
  admin: "/dashboard/admin",
};

function SidebarLinks({
  tabs,
  collapsed,
  onNavigate,
}: {
  tabs: DashboardTab[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const rootHref = tabs[0]?.href ?? "/dashboard";

  return (
    <nav aria-label="Dashboard navigation" className="space-y-1">
      {tabs.map((tab) => {
        const active = isTabActive(pathname, tab, rootHref);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            onClick={onNavigate}
            title={collapsed ? tab.label : undefined}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex min-h-10 items-center overflow-hidden rounded-lg text-[13px] font-medium transition-all duration-150",
              collapsed ? "justify-center px-2 py-2" : "gap-3 pl-3.5 pr-3 py-2",
              active
                ? "border border-border bg-secondary text-foreground font-semibold shadow-xs dark:border-slate-800 dark:bg-slate-900/70"
                : "border border-transparent text-muted-foreground hover:border-border/60 hover:bg-secondary/50 hover:text-foreground",
            )}
          >
            {active ? (
              <span
                aria-hidden="true"
                className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] dark:bg-emerald-400 dark:shadow-[0_0_10px_rgba(52,211,153,0.7)]"
              />
            ) : null}

            <Icon
              weight={active ? "fill" : "duotone"}
              className={cn(
                "h-[18px] w-[18px] shrink-0 transition-colors",
                active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground group-hover:text-foreground",
              )}
            />
            {!collapsed ? (
              <>
                <span className="min-w-0 flex-1 truncate">{tab.label}</span>
                {tab.badge ? (
                  <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-400">
                    {tab.badge}
                  </span>
                ) : null}
              </>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function BrandHeader({ collapsed, eyebrow }: { collapsed: boolean; eyebrow: string }) {
  return (
    <div className={cn("border-b border-border", collapsed ? "px-3 py-5" : "px-5 py-4")}>
      {collapsed ? (
        <div className="mx-auto h-8 w-8 overflow-hidden rounded-md bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 shadow-glow" title={eyebrow}>
          <img
            src="/gear.avif"
            alt="GearUp logo"
            width={32}
            height={32}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <Link
          href="/"
          className="group flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground"
          aria-label="GearUp home"
        >
          <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 shadow-glow">
            <img
              src="/gear.avif"
              alt="GearUp logo"
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
          </span>
          <span className="text-[15px]">GearUp</span>
        </Link>
      )}
    </div>
  );
}

function AccountArea({
  collapsed,
  role,
  roleDashboardHref,
  onLogout,
}: {
  collapsed: boolean;
  role: UserRole;
  roleDashboardHref: string;
  onLogout: () => void;
}) {
  const { user } = useAuthStore();
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "GU";

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 px-2 py-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-[11px] font-semibold text-white shadow-glow"
          aria-label={user?.name}
          title={user?.name}
        >
          {initials}
        </span>
        <button
          type="button"
          onClick={onLogout}
          aria-label="Sign out"
          title="Sign out"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-secondary/40 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
        >
          <SignOutIcon weight="bold" className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 px-3 pb-3">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 p-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-[11px] font-semibold text-white shadow-glow">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium text-foreground">{user?.name ?? "Guest"}</p>
          <p className={cn("text-[10px] font-semibold uppercase tracking-wider", roleAccent[role])}>
            {role}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={roleDashboardHref}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2.5 text-[11px] font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <GearIcon weight="bold" className="h-3 w-3" />
          Settings
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2.5 text-[11px] font-medium text-rose-600 transition-colors hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
        >
          <SignOutIcon weight="bold" className="h-3 w-3" />
          Sign out
        </button>
      </div>
    </div>
  );
}

function CollapseToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className={cn(
        "flex h-8 w-full items-center rounded-md border border-border bg-secondary/40 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
        collapsed ? "justify-center" : "justify-between px-2.5",
      )}
    >
      {!collapsed ? <span>Collapse</span> : null}
      {collapsed ? (
        <CaretRightIcon weight="bold" className="h-3 w-3" />
      ) : (
        <CaretLeftIcon weight="bold" className="h-3 w-3" />
      )}
    </button>
  );
}

export function DashboardSidebar({
  tabs,
  eyebrow,
  role,
  defaultCollapsed = false,
  onCollapsedChange,
}: DashboardSidebarProps) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const persisted = window.localStorage.getItem(COLLAPSED_KEY);
    if (persisted !== null) {
      const next = persisted === "true";
      setCollapsed(next);
      onCollapsedChange?.(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onOpen = () => setDrawerOpen(true);
    window.addEventListener(SIDEBAR_DRAWER_EVENT, onOpen);
    return () => window.removeEventListener(SIDEBAR_DRAWER_EVENT, onOpen);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [usePathname()]);

  useEffect(() => {
    if (!drawerOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    window.localStorage.setItem(COLLAPSED_KEY, String(next));
    onCollapsedChange?.(next);
  };

  const handleLogout = async () => {
    setDrawerOpen(false);
    await logout();
    toast.success("Signed out", { icon: "👋" });
    router.push("/");
  };

  const roleDashboardHref = roleDashboard[role];

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-card/85 backdrop-blur-xl transition-[width] duration-300 lg:flex lg:flex-col",
          collapsed ? "w-20" : "w-64",
        )}
        aria-label={`${eyebrow} navigation`}
      >
        <BrandHeader collapsed={collapsed} eyebrow={eyebrow} />
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarLinks tabs={tabs} collapsed={collapsed} />
        </div>
        <div className="space-y-3 border-t border-border pt-3">
          <AccountArea
            collapsed={collapsed}
            role={role}
            roleDashboardHref={roleDashboardHref}
            onLogout={handleLogout}
          />
          <div className="px-3">
            <CollapseToggle collapsed={collapsed} onToggle={toggleCollapsed} />
          </div>
        </div>
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            aria-label="Close dashboard navigation"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${eyebrow} navigation`}
            tabIndex={-1}
            className="relative flex h-full w-[min(320px,88vw)] flex-col border-r border-border glass-strong shadow-elevated outline-none animate-fade-in-up"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex-1">
                <BrandHeader collapsed={false} eyebrow={eyebrow} />
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="ml-3 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-secondary/40 text-foreground hover:bg-secondary"
                aria-label="Close dashboard navigation"
              >
                <XIcon weight="bold" className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <SidebarLinks tabs={tabs} collapsed={false} onNavigate={() => setDrawerOpen(false)} />
            </div>
            <div className="border-t border-border">
              <AccountArea
                collapsed={false}
                role={role}
                roleDashboardHref={roleDashboardHref}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export type { Icon };
export default DashboardSidebar;