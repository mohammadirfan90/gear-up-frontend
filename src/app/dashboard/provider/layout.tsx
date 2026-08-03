import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Provider Workspace",
  description:
    "List and manage your gear, respond to incoming rental orders, and grow your GearUp business.",
};

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
