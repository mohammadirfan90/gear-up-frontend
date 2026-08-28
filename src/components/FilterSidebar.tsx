"use client";

import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/Slider";
import {
  CalendarBlankIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  TagIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/shared/utils/cn";
import { useGearQuery } from "@/shared/utils/useGearQuery";
import type { Category } from "@/shared/categories";

interface FilterSidebarProps {
  categories: Category[];
}

const formatPrice = (value: number) => `$${value}`;

export function FilterSidebar({ categories }: FilterSidebarProps) {
  const { filters, update, reset, defaults } = useGearQuery();
  const [pending, setPending] = useState({
    search: filters.search,
    brand: filters.brand,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  useEffect(() => {
    setPending({
      search: filters.search,
      brand: filters.brand,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
  }, [filters]);

  const applyPending = () => {
    update({
      search: pending.search.trim(),
      brand: pending.brand.trim(),
      priceMin: pending.priceMin,
      priceMax: pending.priceMax,
      startDate: pending.startDate,
      endDate: pending.endDate,
      page: 1,
    });
  };

  const toggleCategory = (slug: string) => {
    const next = filters.category.includes(slug)
      ? filters.category.filter((value) => value !== slug)
      : [...filters.category, slug];
    update({ category: next, page: 1 });
  };

  const hasActiveFilters =
    filters.search !== defaults.search ||
    filters.brand !== defaults.brand ||
    filters.category.length > 0 ||
    filters.priceMin !== defaults.priceMin ||
    filters.priceMax !== defaults.priceMax ||
    filters.startDate !== defaults.startDate ||
    filters.endDate !== defaults.endDate;

  return (
    <aside className="sticky top-24 flex flex-col gap-6 self-start rounded-xl border border-border glass-strong p-5 shadow-elevated">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <TagIcon weight="duotone" className="h-4 w-4" />
          </span>
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Filters
          </h2>
        </div>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <XIcon weight="bold" className="h-3 w-3" />
            Clear all
          </button>
        ) : null}
      </div>

      <Field label="Search" htmlFor="filter-search">
        <div className="relative">
          <MagnifyingGlassIcon
            weight="bold"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="filter-search"
            placeholder="Name, brand, or keyword"
            value={pending.search}
            onChange={(event) =>
              setPending((prev) => ({ ...prev, search: event.target.value }))
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyPending();
              }
            }}
            className="pl-9"
          />
        </div>
      </Field>

      <Field label="Brand" htmlFor="filter-brand">
        <Input
          id="filter-brand"
          placeholder="e.g. Black Diamond"
          value={pending.brand}
          onChange={(event) =>
            setPending((prev) => ({ ...prev, brand: event.target.value }))
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              applyPending();
            }
          }}
        />
      </Field>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-foreground">
            Price per day
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            {formatPrice(pending.priceMin)} – {formatPrice(pending.priceMax)}
          </span>
        </div>
        <div className="px-1 pt-2">
          <Slider
            min={0}
            max={500}
            step={5}
            value={[pending.priceMin, pending.priceMax]}
            onValueChange={(value) =>
              setPending((prev) => ({
                ...prev,
                priceMin: value[0],
                priceMax: value[1],
              }))
            }
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>$0</span>
          <span>$500+</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Field label="Rental start" htmlFor="filter-start">
          <Input
            id="filter-start"
            type="date"
            value={pending.startDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(event) =>
              setPending((prev) => ({
                ...prev,
                startDate: event.target.value,
                endDate:
                  prev.endDate && prev.endDate < event.target.value
                    ? event.target.value
                    : prev.endDate,
              }))
            }
          />
        </Field>
        <Field label="Rental end" htmlFor="filter-end">
          <Input
            id="filter-end"
            type="date"
            value={pending.endDate}
            min={pending.startDate || new Date().toISOString().slice(0, 10)}
            onChange={(event) =>
              setPending((prev) => ({ ...prev, endDate: event.target.value }))
            }
          />
        </Field>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={applyPending}
        className="self-start"
      >
        <CalendarBlankIcon weight="bold" className="h-3.5 w-3.5" />
        Apply filters
      </Button>

      <div className="h-px bg-border" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-foreground">
            Categories
          </span>
          {filters.category.length > 0 ? (
            <button
              type="button"
              onClick={() => update({ category: [], page: 1 })}
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              Reset
            </button>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          {categories.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">
              Categories unavailable right now.
            </p>
          ) : (
            categories.map((category) => {
              const active = filters.category.includes(category.slug);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.slug)}
                  className={cn(
                    "group flex items-center justify-between rounded-md border px-3 py-2 text-left text-[13px] transition-colors",
                    active
                      ? "border-emerald-500/40 bg-emerald-500/10 text-foreground"
                      : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                  aria-pressed={active}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border transition-colors",
                        active
                          ? "border-emerald-500 bg-emerald-500 text-white dark:text-slate-950"
                          : "border-border bg-background/40",
                      )}
                    >
                      {active ? (
                        <CheckIcon weight="bold" className="h-3 w-3" />
                      ) : null}
                    </span>
                    <span className="font-medium">{category.name}</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {category.slug}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}

export default FilterSidebar;
