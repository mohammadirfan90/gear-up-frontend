import type { Metadata } from "next";
import { Suspense } from "react";
import { GearBrowser } from "./GearBrowser";
import { fetchCategories } from "@/shared/categories";

export const metadata: Metadata = {
  title: "Browse Gear",
  description:
    "Find your next piece of gear from a curated marketplace of premium sports and outdoor equipment.",
  openGraph: {
    title: "Browse Gear — GearUp",
    description:
      "Find your next piece of gear from a curated marketplace of premium sports and outdoor equipment.",
    type: "website",
    siteName: "GearUp",
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Gear — GearUp",
    description:
      "Find your next piece of gear from a curated marketplace of premium sports and outdoor equipment.",
  },
  alternates: {
    canonical: "/gear",
  },
};

export default async function GearPage() {
  const categories = await fetchCategories();
  return (
    <div className="container mx-auto max-w-7xl px-6 py-12 sm:py-16">
      <div className="mb-10 flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
          Catalog
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Find your next piece of gear.
        </h1>
      </div>
      <Suspense fallback={<div className="h-96 animate-shimmer rounded-xl" />}>
        <GearBrowser categories={categories} />
      </Suspense>
    </div>
  );
}
