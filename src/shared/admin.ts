import api, { type ApiEnvelope } from "@/shared/api";

export interface AdminStatsUsers {
  total: number;
  customers: number;
  providers: number;
  suspended: number;
}

export interface AdminStatsGear {
  total: number;
  available: number;
  unavailable: number;
}

export interface AdminStatsCategories {
  total: number;
}

export interface AdminStatsOrders {
  total: number;
  active: number;
  byStatus: Record<string, number>;
}

export interface AdminStatsRevenue {
  completedTotal: number;
  completedCount: number;
  completedAverage: number;
  pendingTotal: number;
  pendingCount: number;
  last30DaysTotal: number;
  last30DaysCount: number;
}

export interface AdminStatsReviews {
  total: number;
  averageRating: number;
}

export interface AdminTopCustomer {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  totalSpent: number;
}

export interface AdminStats {
  users: AdminStatsUsers;
  gear: AdminStatsGear;
  categories: AdminStatsCategories;
  orders: AdminStatsOrders;
  revenue: AdminStatsRevenue;
  reviews: AdminStatsReviews;
  topCustomers: AdminTopCustomer[];
  generatedAt: string;
}

export const fetchAdminStats = async (): Promise<AdminStats> => {
  const { data } = await api.get<ApiEnvelope<AdminStats>>("/admin/stats");
  return data.data;
};

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "customer" | "provider" | "admin";
  status: "active" | "suspended";
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface AdminUserListParams {
  page?: number;
  limit?: number;
  role?: "customer" | "provider" | "admin";
  status?: "active" | "suspended";
  search?: string;
}

export const fetchAdminUsers = async (
  params: AdminUserListParams = {},
): Promise<{ items: AdminUser[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }> => {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.role) search.set("role", params.role);
  if (params.status) search.set("status", params.status);
  if (params.search) search.set("search", params.search);
  const { data } = await api.get<ApiEnvelope<{ items: AdminUser[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }>>(
    `/admin/users?${search.toString()}`,
  );
  return data.data;
};

export const updateAdminUserStatus = async (
  id: string,
  status: "active" | "suspended",
  reason?: string,
): Promise<AdminUser> => {
  const { data } = await api.patch<ApiEnvelope<{ user: AdminUser }>>(
    `/admin/users/${id}`,
    { status, reason },
  );
  return data.data.user;
};
