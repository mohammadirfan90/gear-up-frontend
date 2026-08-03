import api, { type ApiEnvelope } from "@/shared/api";

export interface GearImageInput {
  url: string;
}

export interface CreateGearPayload {
  name: string;
  description: string;
  brand: string;
  pricePerDay: number;
  stock?: number;
  isAvailable?: boolean;
  images?: string[];
  specifications?: Record<string, unknown>;
  categoryId: string;
}

export interface UpdateGearPayload {
  name?: string;
  description?: string;
  brand?: string;
  pricePerDay?: number;
  stock?: number;
  isAvailable?: boolean;
  images?: string[];
  specifications?: Record<string, unknown>;
  categoryId?: string;
}

export const createProviderGear = async (
  payload: CreateGearPayload,
): Promise<{ id: string }> => {
  const { data } = await api.post<ApiEnvelope<{ gear: { id: string } }>>(
    "/provider/gear",
    payload,
  );
  return data.data.gear;
};

export const updateProviderGear = async (
  id: string,
  payload: UpdateGearPayload,
): Promise<{ id: string }> => {
  const { data } = await api.put<ApiEnvelope<{ gear: { id: string } }>>(
    `/provider/gear/${id}`,
    payload,
  );
  return data.data.gear;
};

export const deleteProviderGear = async (id: string): Promise<void> => {
  await api.delete(`/provider/gear/${id}`);
};
