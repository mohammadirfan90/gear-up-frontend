import api, { type ApiEnvelope } from "@/shared/api";

export type ProviderOrderItem = {
  id: string;
  quantity: number;
  pricePerDay: number;
  subtotal: number;
  gearItem: {
    id: string;
    name: string;
    providerId: string;
  };
};

export type ProviderOrderStatus =
  | "placed"
  | "confirmed"
  | "paid"
  | "picked_up"
  | "returned"
  | "cancelled";

export interface ProviderOrder {
  id: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: ProviderOrderStatus;
  createdAt: string;
  items: ProviderOrderItem[];
  customer: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ProviderOrderListResult {
  items: ProviderOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ProviderOrderListParams {
  page?: number;
  limit?: number;
  status?: ProviderOrderStatus;
}

export const fetchProviderOrders = async (
  params: ProviderOrderListParams = {},
): Promise<ProviderOrderListResult> => {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.status) search.set("status", params.status);

  const { data } = await api.get<ApiEnvelope<ProviderOrderListResult>>(
    `/provider/orders?${search.toString()}`,
  );
  return data.data;
};

export const updateProviderOrderStatus = async (
  orderId: string,
  status: ProviderOrderStatus,
  reason?: string,
): Promise<ProviderOrder> => {
  const { data } = await api.patch<ApiEnvelope<{ order: ProviderOrder }>>(
    `/provider/orders/${orderId}`,
    { status, reason },
  );
  return data.data.order;
};
