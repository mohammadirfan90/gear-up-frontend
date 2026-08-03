import api, { type ApiEnvelope } from "@/shared/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api";

export interface OccupiedRange {
  startDate: string;
  endDate: string;
}

export interface CreateRentalPayload {
  gearItemId: string;
  startDate: string;
  endDate: string;
  quantity?: number;
  notes?: string;
}

export interface RentalOrderItem {
  id: string;
  quantity: number;
  pricePerDay: number;
  subtotal: number;
}

export interface RentalOrder {
  id: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status:
    | "placed"
    | "confirmed"
    | "paid"
    | "picked_up"
    | "returned"
    | "cancelled";
  notes?: string | null;
  createdAt: string;
  items: RentalOrderItem[];
}

export interface RentalListResult {
  items: RentalOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface RentalListParams {
  page?: number;
  limit?: number;
  status?: RentalOrder["status"];
}

export const fetchOccupiedDates = async (
  gearItemId: string,
): Promise<OccupiedRange[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/rentals/occupied/${gearItemId}`,
      { cache: "no-store" },
    );
    if (!response.ok) return [];
    const payload = (await response.json()) as ApiEnvelope<{
      dates: OccupiedRange[];
    }>;
    return payload.data?.dates ?? [];
  } catch {
    return [];
  }
};

export const fetchMyRentals = async (
  params: RentalListParams = {},
): Promise<RentalListResult> => {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.status) search.set("status", params.status);

  const { data } = await api.get<ApiEnvelope<RentalListResult>>(
    `/rentals?${search.toString()}`,
  );
  return data.data;
};

export const createRentalOrder = async (
  payload: CreateRentalPayload,
): Promise<RentalOrder> => {
  const { data } = await api.post<ApiEnvelope<{ order: RentalOrder }>>(
    "/rentals",
    {
      startDate: payload.startDate,
      endDate: payload.endDate,
      notes: payload.notes,
      items: [
        {
          gearItemId: payload.gearItemId,
          quantity: payload.quantity ?? 1,
        },
      ],
    },
  );
  return data.data.order;
};
