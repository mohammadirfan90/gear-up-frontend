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
