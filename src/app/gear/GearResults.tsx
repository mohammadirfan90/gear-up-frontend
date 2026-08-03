"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PackageIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { GearCard } from "@/components/GearCard";
import { Button } from "@/components/ui/Button";
import { GearGridSkeleton } from "@/components/GearGridSkeleton";
import { fetchGearList, type GearListResult } from "@/shared/gear";
import { useGearQuery } from "@/shared/utils/useGearQuery";

export function GearResults() {
  const { filters, update } = useGearQuery();
  const [result, setResult] = useState<GearListResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    fetchGearList({
      page: filters.page,
      limit: 12,
      search: filters.search || undefined,
      brand: filters.brand || undefined,
      categoryId: undefined,
      priceMin: filters.priceMin > 0 ? filters.priceMin : undefined,
      priceMax: filters.priceMax < 500 ? filters.priceMax : undefined,
      isAvailable: true,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    })
      .then((data) => {
        if (active) setResult(data);
      })
      .catch(() => {
        if (active) setError("We couldn’t load gear right now. Please try again.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters]);

  if (isLoading) {
    return <GearGridSkeleton count={6} />;
  }

  if (error) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 text-center">
        <WarningCircleIcon weight="duotone" className="mb-3 h-8 w-8 text-destructive" />
        <p className="text-sm font-medium text-foreground">Something went wrong</p>
        <p className="mt-1 text-[13px] text-muted-foreground">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="mt-5"
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!result || result.items.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-border bg-card/60 px-6 text-center">
        <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground">
          <PackageIcon weight="duotone" className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium text-foreground">No gear matches these filters</p>
        <p className="mt-1 max-w-xs text-[13px] leading-5 text-muted-foreground">
          Try widening your price range or clearing a filter to see more options.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => update({
            search: "",
            category: [],
            brand: "",
            priceMin: 0,
            priceMax: 500,
            startDate: "",
            endDate: "",
            page: 1,
          })}
          className="mt-5"
        >
          Clear filters
        </Button>
      </div>
    );
  }

  const { pagination } = result;
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {result.items.map((gear) => (
          <GearCard key={gear.id} gear={gear} />
        ))}
      </div>

      {pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-border pt-5">
          <p className="text-[12px] text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrev}
              onClick={() => update({ page: pagination.page - 1 })}
              aria-label="Previous page"
            >
              <ArrowLeftIcon weight="bold" className="h-3.5 w-3.5" />
            </Button>
            <span className="min-w-16 text-center text-[12px] text-muted-foreground">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() => update({ page: pagination.page + 1 })}
              aria-label="Next page"
            >
              <ArrowRightIcon weight="bold" className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default GearResults;
