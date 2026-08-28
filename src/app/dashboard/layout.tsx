import type { Metadata } from "next";
import { requireUser } from "@/shared/serverAuth";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Manage your rentals, gear, payments, and account from a single GearUp workspace.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Source-of-truth auth gate for the entire /dashboard segment. Per-role
  // layouts (customer/provider/admin) layer a stricter role check on top.
  // Running here ensures even future top-level dashboard routes cannot
  // accidentally bypass authentication.
  await requireUser("/dashboard");
  return <>{children}</>;
}
