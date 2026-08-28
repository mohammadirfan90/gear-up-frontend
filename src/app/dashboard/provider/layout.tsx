import type { Metadata } from "next";
import { requireRole } from "@/shared/serverAuth";

export const metadata: Metadata = {
  title: "Provider Workspace",
  description:
    "List and manage your gear, respond to incoming rental orders, and grow your GearUp business.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side source-of-truth guard: resolves the user via /auth/me and
  // redirects anyone without the `provider` role to their own dashboard.
  // This runs on every protected request and cannot be bypassed by
  // tampering with cookies (unlike the client-side proxy).
  await requireRole("provider", "/dashboard/provider");
  return <>{children}</>;
}
