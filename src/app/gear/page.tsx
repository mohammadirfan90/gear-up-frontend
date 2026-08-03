import { Suspense } from "react";
import { GearBrowser } from "./GearBrowser";
import { fetchCategories } from "@/shared/categories";

export const metadata = {
  title: "Browse Gear",
  description:
    "Find your next piece of gear from a curated marketplace of premium sports and outdoor equipment.",
};

export default async function GearPage() {
  const categories = await fetchCategories();
  return (
    <div className="container mx-auto max-w-7xl px-6 py-12 sm:py-16">
      <div className="mb-10 flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lime-400">
          Catalog
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Find your next piece of gear.
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Filter by category, brand, price, and rental window. Everything you
          see is in stock, ready to ship, and protected by GearUp.
        </p>
      </div>
      <Suspense fallback={<div className="h-96 animate-shimmer rounded-xl" />}>
        <GearBrowser categories={categories} />
      </Suspense>
    </div>
  );
}
