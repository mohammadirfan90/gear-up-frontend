"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PackageIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { GearCard } from "@/components/GearCard";
import { GearGridSkeleton } from "@/components/GearGridSkeleton";
import { Button } from "@/components/ui/Button";
import { fetchGearList, type GearListParams } from "@/shared/gear";
import { useGearQuery } from "@/shared/utils/useGearQuery";

const PAGE_SIZE = 12;

export function GearGrid() {
  const { filters, update } = useGearQuery();
  const params: GearListParams = {
    page: filters.page,
    limit: PAGE_SIZE,
    search: filters.search || undefined,
    categorySlugs: filters.category.length > 0 ? filters.category : undefined,
    brand: filters.brand || undefined,
    priceMin: filters.priceMin > 0 ? filters.priceMin : undefined,
    priceMax: filters.priceMax < 500 ? filters.priceMax : undefined,
    isAvailable: true,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };

  const query = useQuery({
    queryKey: ["gear", params],
    queryFn: () => fetchGearList(params),
    placeholderData: (previous) => previous,
  });

  if (query.isPending) {
    return <GearGridSkeleton count={PAGE_SIZE} />;
  }

  if (query.isError) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 text-center">
        <WarningCircleIcon weight="duotone" className="mb-3 h-8 w-8 text-destructive" />
        <p className="text-sm font-medium text-foreground">Something went wrong</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          We couldn&apos;t load gear right now. Please try again.
        </p>
        <Button variant="outline" size="sm" onClick={() => query.refetch()} className="mt-5">
          Try again
        </Button>
      </div>
    );
  }

  const result = query.data;
  if (!result || result.items.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-border bg-card/60 px-6 text-center">
        <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground">
          <PackageIcon weight="duotone" className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium text-foreground">No Items Found</p>
        <p className="mt-1 max-w-xs text-[13px] leading-5 text-muted-foreground">
          Try widening your price range or clearing a filter to see more options.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            update({
              search: "",
              category: [],
              brand: "",
              priceMin: 0,
              priceMax: 500,
              startDate: "",
              endDate: "",
              page: 1,
            })
          }
          className="mt-5"
        >
          Clear filters
        </Button>
      </div>
    );
  }

  const { pagination } = result;
  return (
    <div className="relative flex flex-col gap-8">
      {query.isFetching ? (
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-1 w-24 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-1/2 animate-shimmer rounded-full bg-lime-400" />
        </div>
      ) : null}
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
              disabled={!pagination.hasPrev || query.isFetching}
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
              disabled={!pagination.hasNext || query.isFetching}
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

export default GearGrid;
