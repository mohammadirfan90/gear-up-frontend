"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretRightIcon, ListIcon } from "@phosphor-icons/react/dist/ssr";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PublicPageButton } from "@/components/PublicPageButton";
import type { DashboardTab } from "@/components/DashboardShell";
import { cn } from "@/shared/utils/cn";

interface WorkspaceTopBarProps {
  tabs: DashboardTab[];
  eyebrow: string;
  publicPageHref?: string;
}

export const SIDEBAR_DRAWER_EVENT = "gearup:sidebar:open";

export function WorkspaceTopBar({
  tabs,
  eyebrow,
  publicPageHref = "/",
}: WorkspaceTopBarProps) {
  const pathname = usePathname();
  const rootHref = tabs[0]?.href ?? "/dashboard";
  const root = eyebrow.replace(/ workspace$/i, "");
  const current =
    tabs.find((tab) =>
      tab.href === rootHref ? pathname === tab.href : pathname.startsWith(tab.href),
    )?.label ?? eyebrow;

  const openDrawer = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(SIDEBAR_DRAWER_EVENT));
  };

  return (
    <div className="sticky top-0 z-30 border-b border-border glass-strong">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={openDrawer}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary/40 text-foreground transition-colors hover:bg-secondary lg:hidden"
            aria-label="Open workspace navigation"
          >
            <ListIcon weight="bold" className="h-4 w-4" />
          </button>
          <nav aria-label="Workspace breadcrumb" className="min-w-0 truncate">
            <ol className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <li>
                <Link href={rootHref} className="font-semibold text-foreground hover:text-emerald-500 dark:hover:text-emerald-400">
                  {root}
                </Link>
              </li>
              {current !== root ? (
                <>
                  <li aria-hidden>
                    <CaretRightIcon weight="bold" className="h-2.5 w-2.5" />
                  </li>
                  <li className="truncate text-foreground">{current}</li>
                </>
              ) : null}
            </ol>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <PublicPageButton href={publicPageHref} className="hidden sm:inline-flex" />
          <ThemeToggle />
        </div>
      </div>
      <div className={cn("px-4 pb-3 pt-2 sm:hidden")}>
        <PublicPageButton href={publicPageHref} className="w-full justify-center" />
      </div>
    </div>
  );
}

export default WorkspaceTopBar;