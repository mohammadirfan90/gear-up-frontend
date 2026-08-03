import api, { type ApiEnvelope } from "@/shared/api";

export interface PaymentListItem {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  provider: "stripe" | "sslcommerz";
  status: "pending" | "completed" | "failed" | "refunded";
  failureReason?: string | null;
  paidAt?: string | null;
  createdAt: string;
  rentalOrder: {
    id: string;
    startDate: string;
    endDate: string;
  };
}

export interface PaymentListResult {
  items: PaymentListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaymentListParams {
  page?: number;
  limit?: number;
  status?: PaymentListItem["status"];
}

export const fetchPayments = async (
  params: PaymentListParams = {},
): Promise<PaymentListResult> => {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.status) search.set("status", params.status);

  const { data } = await api.get<ApiEnvelope<PaymentListResult>>(
    `/payments?${search.toString()}`,
  );
  return data.data;
};

export const PAYMENT_PROVIDER_LABELS: Record<PaymentListItem["provider"], string> = {
  stripe: "Stripe",
  sslcommerz: "SSLCommerz",
};
