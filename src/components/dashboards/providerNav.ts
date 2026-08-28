import {
  FlagBannerIcon,
  ReceiptIcon,
  StorefrontIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { DashboardTab } from "@/components/DashboardShell";

export const PROVIDER_NAV_TABS: DashboardTab[] = [
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
