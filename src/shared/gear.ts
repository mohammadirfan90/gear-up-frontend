import type { ApiEnvelope } from "@/shared/api";

export interface GearSummary {
  id: string;
  name: string;
  brand: string;
  description: string;
  pricePerDay: number;
  stock: number;
  isAvailable: boolean;
  images: string[];
  specifications?: Record<string, unknown> | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  provider: {
    id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface GearListResult {
  items: GearSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface GearReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
  };
}

export interface GearDetail extends GearSummary {
  specifications: Record<string, unknown> | null;
  reviewCount: number;
  avgRating: number | null;
  reviews?: GearReview[];
}

export interface GearReviewsResult {
  items: GearReview[];
  stats: {
    average: number;
    count: number;
  };
  pagination: GearListResult["pagination"];
}

export interface GearListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  categorySlug?: string;
  categorySlugs?: string[];
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  isAvailable?: boolean;
  providerId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: "pricePerDay" | "createdAt" | "name";
  sortOrder?: "asc" | "desc";
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api";

export const fetchFeaturedGear = async (
  limit = 4,
): Promise<GearSummary[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/gear?limit=${limit}&isAvailable=true&sortBy=createdAt&sortOrder=desc`,
      { next: { revalidate: 60 } },
    );
    if (!response.ok) {
      return [];
    }
    const payload = (await response.json()) as ApiEnvelope<GearListResult>;
    return payload.data?.items ?? [];
  } catch {
    return [];
  }
};

export const fetchGearList = async (
  params: GearListParams,
): Promise<GearListResult> => {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.search) search.set("search", params.search);
  if (params.categoryId) search.set("categoryId", params.categoryId);
  if (params.categorySlug) search.set("category", params.categorySlug);
  if (params.categorySlugs?.length)
    search.set("category", params.categorySlugs.join(","));
  if (params.brand) search.set("brand", params.brand);
  if (params.priceMin !== undefined)
    search.set("priceMin", String(params.priceMin));
  if (params.priceMax !== undefined)
    search.set("priceMax", String(params.priceMax));
  if (params.isAvailable !== undefined)
    search.set("isAvailable", String(params.isAvailable));
  if (params.providerId) search.set("providerId", params.providerId);
  if (params.startDate) search.set("startDate", params.startDate);
  if (params.endDate) search.set("endDate", params.endDate);
  if (params.sortBy) search.set("sortBy", params.sortBy);
  if (params.sortOrder) search.set("sortOrder", params.sortOrder);

  const response = await fetch(`${API_BASE_URL}/gear?${search.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Gear list request failed: ${response.status}`);
  }
  const payload = (await response.json()) as ApiEnvelope<GearListResult>;
  return payload.data;
};

export const fetchGearById = async (id: string): Promise<GearDetail> => {
  const response = await fetch(`${API_BASE_URL}/gear/${id}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Gear detail request failed: ${response.status}`);
  }
  const payload = (await response.json()) as ApiEnvelope<{ gear: GearDetail }>;
  return payload.data.gear;
};

export const fetchGearReviews = async (
  gearId: string,
): Promise<GearReviewsResult> => {
  const response = await fetch(
    `${API_BASE_URL}/reviews/gear/${gearId}?page=1&limit=10`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error(`Review request failed: ${response.status}`);
  }
  const payload = (await response.json()) as ApiEnvelope<GearReviewsResult>;
  return payload.data;
};
