import type { Metadata } from "next";
import { requireRole } from "@/shared/serverAuth";

export const metadata: Metadata = {
  title: "Admin Workspace",
  description:
    "Monitor GearUp marketplace health, manage users, audit rentals, and moderate gear listings.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side source-of-truth guard: resolves the user via /auth/me and
  // redirects anyone without the `admin` role to their own dashboard.
  // This runs on every protected request and cannot be bypassed by
  // tampering with cookies (unlike the client-side proxy).
  await requireRole("admin", "/dashboard/admin");
  return <>{children}</>;
}
