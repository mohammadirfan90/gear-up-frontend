import api, { type ApiEnvelope } from "@/shared/api";

export interface PaymentIntentResult {
  paymentId: string;
  transactionId: string;
  amount: number;
  status: string;
  clientSecret: string;
}

export const createPaymentIntent = async (
  rentalOrderId: string,
): Promise<PaymentIntentResult> => {
  const { data } = await api.post<ApiEnvelope<PaymentIntentResult>>(
    "/payments/create",
    { rentalOrderId },
  );
  return data.data;
};

export interface PaymentSyncResult {
  status: "pending" | "completed" | "failed" | "refunded";
  orderStatus: string;
  synced: boolean;
}

/**
 * Asks the server to reconcile a payment against Stripe directly.
 *
 * The webhook is the source of truth for marking an order paid, but it can be
 * delayed or unconfigured for a given deployment. Calling this after a
 * successful client-side confirmation settles the order instead of leaving the
 * UI polling a status that may never change.
 */
export const syncPaymentStatus = async (
  paymentId: string,
): Promise<PaymentSyncResult> => {
  const { data } = await api.post<ApiEnvelope<PaymentSyncResult>>(
    `/payments/${paymentId}/sync`,
  );
  return data.data;
};
