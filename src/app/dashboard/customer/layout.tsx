import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Dashboard",
  description:
    "Track your GearUp rentals, complete payments, and manage your customer account.",
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
