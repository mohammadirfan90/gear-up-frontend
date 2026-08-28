"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/shared/utils/cn";

export function ThemeToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const next = isDark ? "light" : "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-secondary/50 text-foreground transition-colors hover:bg-secondary",
        className,
      )}
    >
      <span className="relative flex h-4 w-4 items-center justify-center" aria-hidden>
        <SunIcon
          weight="duotone"
          className={cn(
            "absolute h-4 w-4 text-amber-400 transition-all duration-300",
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100",
          )}
        />
        <MoonIcon
          weight="duotone"
          className={cn(
            "absolute h-4 w-4 text-emerald-400 transition-all duration-300",
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0",
          )}
        />
      </span>
    </button>
  );
}

export default ThemeToggle;