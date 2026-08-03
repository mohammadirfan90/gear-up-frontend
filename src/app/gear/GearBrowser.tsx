"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  FunnelSimpleIcon,
  GridFourIcon,
  ListIcon,
  SortAscendingIcon,
} from "@phosphor-icons/react/dist/ssr";
import { FilterSidebar } from "@/components/FilterSidebar";
import { GearCard } from "@/components/GearCard";
import { GearGridSkeleton } from "@/components/GearGridSkeleton";
import { GearResults } from "./GearResults";
import { Button } from "@/components/ui/Button";
import { useGearQuery } from "@/shared/utils/useGearQuery";
import type { Category } from "@/shared/categories";

interface GearBrowserProps {
  categories: Category[];
}

const sortOptions = [
  { value: "createdAt", label: "Newest" },
  { value: "pricePerDay", label: "Price" },
  { value: "name", label: "Name" },
] as const;

export function GearBrowser({ categories }: GearBrowserProps) {
  const { filters, update } = useGearQuery();

  const activeSortLabel = useMemo(
    () =>
      sortOptions.find((option) => option.value === filters.sortBy)?.label ??
      "Sort",
    [filters.sortBy],
  );

  const toggleSort = (value: (typeof sortOptions)[number]["value"]) => {
    if (filters.sortBy === value) {
      update({
        sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
      });
    } else {
      update({
        sortBy: value,
        sortOrder: value === "pricePerDay" ? "asc" : "desc",
      });
    }
  };

  const activeFilters = [
    filters.search && `Search: ${filters.search}`,
    filters.brand && `Brand: ${filters.brand}`,
    filters.category.length > 0 &&
      `Categories: ${filters.category.join(", ")}`,
    (filters.priceMin > 0 || filters.priceMax < 500) &&
      `$${filters.priceMin} – $${filters.priceMax}`,
    filters.startDate && `From ${filters.startDate}`,
    filters.endDate && `Until ${filters.endDate}`,
  ].filter(Boolean) as string[];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
      <FilterSidebar categories={categories} />

      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-4 py-3">
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <FunnelSimpleIcon weight="bold" className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">
              {activeFilters.length}
            </span>{" "}
            active filter{activeFilters.length === 1 ? "" : "s"}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-[12px] text-muted-foreground sm:inline">
              Sort by
            </span>
            <div className="flex items-center gap-1 rounded-md border border-border bg-secondary/40 p-1">
              {sortOptions.map((option) => {
                const active = filters.sortBy === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleSort(option.value)}
                    className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[12px] font-medium transition-colors ${
                      active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option.label}
                    {active ? (
                      <SortAscendingIcon
                        weight="bold"
                        className={`h-3 w-3 transition-transform ${
                          filters.sortOrder === "desc" ? "rotate-180" : ""
                        }`}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <span className="text-[11px] text-muted-foreground">
              ({activeSortLabel})
            </span>
          </div>
        </div>

        {activeFilters.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {activeFilters.map((filter) => (
              <span
                key={filter}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/40 px-3 py-1 text-[11px] font-medium text-muted-foreground"
              >
                {filter}
              </span>
            ))}
          </div>
        ) : null}

        <Suspense
          fallback={
            <div className="flex flex-col gap-6">
              <GearGridSkeleton count={6} />
            </div>
          }
        >
          <GearResults />
        </Suspense>

        <div className="flex items-center justify-between border-t border-border pt-6 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <GridFourIcon weight="bold" className="h-3.5 w-3.5" />
            Grid view
          </span>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-foreground hover:text-lime-300"
          >
            Track your rentals
            <ArrowRightIcon weight="bold" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default GearBrowser;
