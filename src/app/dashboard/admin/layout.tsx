import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Workspace",
  description:
    "Monitor GearUp marketplace health, manage users, audit rentals, and moderate gear listings.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
