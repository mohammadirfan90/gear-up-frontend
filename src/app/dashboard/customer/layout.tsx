import type { Metadata } from "next";
import { requireRole } from "@/shared/serverAuth";

export const metadata: Metadata = {
  title: "Customer Dashboard",
  description:
    "Track your GearUp rentals, complete payments, and manage your customer account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side source-of-truth guard: resolves the user via /auth/me and
  // redirects anyone without the `customer` role to their own dashboard.
  // This runs on every protected request and cannot be bypassed by
  // tampering with cookies (unlike the client-side proxy).
  await requireRole("customer", "/dashboard/customer");
  return <>{children}</>;
}
