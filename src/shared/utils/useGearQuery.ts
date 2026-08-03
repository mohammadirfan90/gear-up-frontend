"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

export interface GearFilters {
  search: string;
  category: string[];
  brand: string;
  priceMin: number;
  priceMax: number;
  startDate: string;
  endDate: string;
  sortBy: "createdAt" | "pricePerDay" | "name";
  sortOrder: "asc" | "desc";
  page: number;
}

const DEFAULTS: GearFilters = {
  search: "",
  category: [],
  brand: "",
  priceMin: 0,
  priceMax: 500,
  startDate: "",
  endDate: "",
  sortBy: "createdAt",
  sortOrder: "desc",
  page: 1,
};

const NUMERIC_KEYS = new Set<keyof GearFilters>(["priceMin", "priceMax", "page"]);

const parseFilters = (params: URLSearchParams): GearFilters => {
  const categories = (params.get("category") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const priceMin = Number(params.get("priceMin") ?? DEFAULTS.priceMin);
  const priceMax = Number(params.get("priceMax") ?? DEFAULTS.priceMax);
  const page = Number(params.get("page") ?? DEFAULTS.page);

  const sortByRaw = params.get("sortBy") ?? DEFAULTS.sortBy;
  const sortBy: GearFilters["sortBy"] =
    sortByRaw === "pricePerDay" || sortByRaw === "name" ? sortByRaw : "createdAt";

  const sortOrderRaw = params.get("sortOrder") ?? DEFAULTS.sortOrder;
  const sortOrder: GearFilters["sortOrder"] =
    sortOrderRaw === "asc" ? "asc" : "desc";

  return {
    search: params.get("search") ?? "",
    category: categories,
    brand: params.get("brand") ?? "",
    priceMin: Number.isFinite(priceMin) ? priceMin : DEFAULTS.priceMin,
    priceMax: Number.isFinite(priceMax) ? priceMax : DEFAULTS.priceMax,
    startDate: params.get("startDate") ?? "",
    endDate: params.get("endDate") ?? "",
    sortBy,
    sortOrder,
    page: Number.isFinite(page) ? Math.max(1, page) : 1,
  };
};

export const useGearQuery = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const buildQueryString = useCallback(
    (next: Partial<GearFilters>) => {
      const merged: GearFilters = { ...filters, ...next };
      const params = new URLSearchParams();

      if (merged.search) params.set("search", merged.search);
      if (merged.category.length > 0) params.set("category", merged.category.join(","));
      if (merged.brand) params.set("brand", merged.brand);
      if (merged.priceMin > DEFAULTS.priceMin)
        params.set("priceMin", String(merged.priceMin));
      if (merged.priceMax < DEFAULTS.priceMax)
        params.set("priceMax", String(merged.priceMax));
      if (merged.startDate) params.set("startDate", merged.startDate);
      if (merged.endDate) params.set("endDate", merged.endDate);
      if (merged.sortBy !== DEFAULTS.sortBy) params.set("sortBy", merged.sortBy);
      if (merged.sortOrder !== DEFAULTS.sortOrder)
        params.set("sortOrder", merged.sortOrder);
      if (merged.page > 1 && merged.page !== filters.page)
        params.set("page", String(merged.page));

      return params.toString();
    },
    [filters],
  );

  const update = useCallback(
    (next: Partial<GearFilters>) => {
      const query = buildQueryString(next);
      const url = query ? `${pathname}?${query}` : pathname;
      router.replace(url, { scroll: false });
    },
    [buildQueryString, pathname, router],
  );

  const reset = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  return {
    filters,
    update,
    reset,
    defaults: DEFAULTS,
    NUMERIC_KEYS,
  };
};
