import api, { type ApiEnvelope } from "@/shared/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api";

export interface OccupiedRange {
  startDate: string;
  endDate: string;
}

export interface GearAvailability {
  dates: OccupiedRange[];
  availableToday: number;
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
  gearItem?: {
    id: string;
    name: string;
    brand: string;
    images: string[];
    pricePerDay: number;
    providerId?: string;
  };
}

export interface RentalOrderPayment {
  id: string;
  status: string;
  amount: number;
  provider: string;
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
  payments?: RentalOrderPayment[];
  customer?: {
    id: string;
    name: string;
    email: string;
  };
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
): Promise<GearAvailability> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/rentals/occupied/${gearItemId}`,
      { cache: "no-store" },
    );
    if (!response.ok) return { dates: [], availableToday: 0 };
    const payload = (await response.json()) as ApiEnvelope<GearAvailability>;
    return payload.data ?? { dates: [], availableToday: 0 };
  } catch {
    return { dates: [], availableToday: 0 };
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

export const fetchRentalOrder = async (orderId: string): Promise<RentalOrder> => {
  const { data } = await api.get<ApiEnvelope<{ order: RentalOrder }>>(
    `/rentals/${orderId}`,
  );
  return data.data.order;
};

/**
 * Customer-side cancellation. The server only permits this while the order is
 * unpaid (`placed` or `confirmed`) — once paid it requires a refund path.
 */
export const cancelRentalOrder = async (
  orderId: string,
  reason?: string,
): Promise<RentalOrder> => {
  const { data } = await api.patch<ApiEnvelope<{ order: RentalOrder }>>(
    `/rentals/${orderId}/status`,
    { status: "cancelled", reason },
  );
  return data.data.order;
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
