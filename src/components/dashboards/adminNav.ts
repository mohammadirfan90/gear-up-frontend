import {
  ReceiptIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  UsersIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { DashboardTab } from "@/components/DashboardShell";

export const ADMIN_NAV_TABS: DashboardTab[] = [
  {
    label: "Overview",
    href: "/dashboard/admin",
    icon: ShoppingBagIcon,
    description: "Platform health and KPIs",
  },
  {
    label: "Users",
    href: "/dashboard/admin/users",
    icon: UsersIcon,
    description: "Manage accounts and roles",
  },
  {
    label: "Rentals",
    href: "/dashboard/admin/rentals",
    icon: ReceiptIcon,
    description: "Audit rentals and transactions",
  },
  {
    label: "Gear",
    href: "/dashboard/admin/gear",
    icon: ShoppingBagIcon,
    description: "Moderate listings",
  },
  {
    label: "Profile",
    href: "/dashboard/admin/profile",
    icon: UserCircleIcon,
    description: "Account settings",
  },
];
