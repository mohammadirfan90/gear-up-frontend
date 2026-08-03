import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in to GearUp",
  description:
    "Access your GearUp account to rent premium sports and outdoor gear, manage bookings, and track payments.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
