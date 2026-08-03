import type { ApiEnvelope } from "@/shared/api";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryListResult {
  items: Category[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api";

export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/categories?limit=100&page=1`,
      { next: { revalidate: 300 } },
    );
    if (!response.ok) return [];
    const payload = (await response.json()) as ApiEnvelope<CategoryListResult>;
    return payload.data?.items ?? [];
  } catch {
    return [];
  }
};
