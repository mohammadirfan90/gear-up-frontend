import api, { type ApiEnvelope } from "@/shared/api";

export interface CreateReviewPayload {
  rentalOrderId: string;
  rating: number;
  comment?: string;
}

export interface ReviewRecord {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  rentalOrderId: string;
  customerId: string;
  gearItemId: string;
}

export const createReview = async (
  payload: CreateReviewPayload,
): Promise<ReviewRecord> => {
  const { data } = await api.post<ApiEnvelope<{ review: ReviewRecord }>>(
    "/reviews",
    payload,
  );
  return data.data.review;
};
