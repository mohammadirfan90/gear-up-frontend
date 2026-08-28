"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  SignInIcon,
  SignOutIcon,
  UserCircleIcon,
  ShoppingBagOpenIcon,
  StorefrontIcon,
  ShieldCheckIcon,
  GearIcon,
  ListIcon,
  CaretDownIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useAuthStore, type UserRole } from "@/store/authStore";
import { cn } from "@/shared/utils/cn";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavLink {
  href: string;
  label: string;
}

const GUEST_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/gear", label: "Browse Gear" },
];

const ROLE_LINKS: Record<UserRole, NavLink[]> = {
  customer: [
    { href: "/", label: "Home" },
    { href: "/gear", label: "Browse Gear" },
    { href: "/dashboard/customer", label: "Dashboard" },
  ],
  provider: [
    { href: "/", label: "Home" },
    { href: "/gear", label: "Browse Gear" },
    { href: "/dashboard/provider", label: "Workspace" },
  ],
  admin: [
    { href: "/", label: "Home" },
    { href: "/gear", label: "Browse Gear" },
    { href: "/dashboard/admin", label: "Workspace" },
  ],
};

const roleIcon = (role: UserRole) => {
  switch (role) {
    case "customer":
      return ShoppingBagOpenIcon;
    case "provider":
      return StorefrontIcon;
    case "admin":
      return ShieldCheckIcon;
  }
};

const roleAccent: Record<UserRole, string> = {
  customer: "text-emerald-600 dark:text-emerald-400",
  provider: "text-emerald-600 dark:text-emerald-400",
  admin: "text-emerald-600 dark:text-emerald-400",
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isInitializing, logout } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClickAway = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  const links = isAuthenticated && user ? ROLE_LINKS[user.role] : GUEST_LINKS;
  const RoleIcon = user ? roleIcon(user.role) : null;

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    toast.success("Signed out", { icon: "👋" });
    router.push("/");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "GU";

  const isHomeHero = pathname === "/" && !scrolled;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled
          ? "border-border glass-strong shadow-elevated"
          : isHomeHero
            ? "border-white/10 bg-black/40 backdrop-blur-md"
            : "border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60",
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link
          href="/"
          className={cn(
            "group flex items-center gap-2 text-sm font-semibold tracking-tight transition-colors",
            isHomeHero ? "text-white" : "text-foreground",
          )}
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

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group relative px-3 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? isHomeHero
                      ? "text-white"
                      : "text-foreground"
                    : isHomeHero
                      ? "text-white/80 hover:text-white"
                      : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
                <span
                  className={cn(
                    "absolute inset-x-3 -bottom-px h-px origin-left scale-x-0 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600 transition-transform duration-300",
                    active && "scale-x-100",
                    "group-hover:scale-x-100",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle className={cn("h-9 w-9 rounded-md", isHomeHero && "border-white/15 bg-black/40 text-white hover:bg-black/60")} />
          {isInitializing ? (
            <div className="h-9 w-32 animate-shimmer rounded-md" />
          ) : isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
                  isHomeHero
                    ? "border-white/15 bg-black/40 text-white backdrop-blur hover:bg-black/60"
                    : "border-border bg-secondary/50 text-foreground hover:bg-secondary",
                )}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-[11px] font-semibold text-white">
                  {initials}
                </span>
                <span className="flex flex-col items-start leading-tight">
                  <span className={cn("text-[12px] font-medium", isHomeHero ? "text-white" : "text-foreground")}>
                    {user.name}
                  </span>
                  <span className={cn("text-[10px] uppercase tracking-wider", isHomeHero ? "text-emerald-400" : roleAccent[user.role])}>
                    {user.role}
                  </span>
                </span>
                <CaretDownIcon
                  weight="bold"
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    isHomeHero ? "text-white/70" : "text-muted-foreground",
                    menuOpen && "rotate-180",
                  )}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-lg border border-border glass-strong shadow-elevated animate-fade-in-up">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-[13px] font-medium text-foreground">
                      {user.name}
                    </p>
                    <p className="truncate text-[12px] text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <div className="p-1">
                    <Link
                      href={
                        user.role === "customer"
                          ? "/dashboard/customer"
                          : user.role === "provider"
                            ? "/dashboard/provider"
                            : "/dashboard/admin"
                      }
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-[13px] text-foreground transition-colors hover:bg-secondary"
                    >
                      {RoleIcon && <RoleIcon weight="duotone" className="h-4 w-4" />}
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/customer"
                      className="hidden items-center gap-2 rounded-md px-3 py-2 text-[13px] text-foreground transition-colors hover:bg-secondary"
                    >
                      <UserCircleIcon weight="duotone" className="h-4 w-4" />
                      Profile
                    </Link>
                  </div>
                  <div className="border-t border-border p-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <SignOutIcon weight="bold" className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/auth/login"
                className={cn(
                  "inline-flex items-center gap-2 rounded-md border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                  isHomeHero
                    ? "border-white/20 bg-black/40 text-white backdrop-blur hover:bg-black/60"
                    : "border-border bg-secondary/40 text-foreground hover:bg-secondary",
                )}
              >
                <SignInIcon weight="bold" className="h-3.5 w-3.5" />
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-glow transition-transform hover:scale-[1.02] dark:from-emerald-400 dark:via-emerald-500 dark:to-teal-600 dark:text-slate-950"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle className={cn("h-9 w-9 rounded-md", isHomeHero && "border-white/15 bg-black/40 text-white hover:bg-black/60")} />
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-md border text-foreground",
              isHomeHero
                ? "border-white/20 bg-black/40 text-white"
                : "border-border bg-secondary/40 text-foreground",
            )}
            aria-label="Toggle navigation"
          >
            <ListIcon weight="bold" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border glass-strong md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-6 py-4">
            {links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="my-2 h-px bg-border" />
            {isAuthenticated && user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm font-medium text-destructive"
              >
                <SignOutIcon weight="bold" className="h-4 w-4" />
                Sign out
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/auth/login"
                  className="flex items-center justify-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm font-medium text-foreground"
                >
                  <SignInIcon weight="bold" className="h-4 w-4" />
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="flex items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 px-3 py-2 text-sm font-semibold text-white dark:from-emerald-400 dark:via-emerald-500 dark:to-teal-600 dark:text-slate-950"
                >
                  Get started
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
