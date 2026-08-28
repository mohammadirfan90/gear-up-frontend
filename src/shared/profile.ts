import api, { type ApiEnvelope } from "./api";
import type { AuthUser } from "@/store/authStore";

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
}

export const updateMyProfile = async (
  payload: UpdateProfilePayload,
): Promise<AuthUser> => {
  const { data } = await api.patch<ApiEnvelope<{ user: AuthUser }>>(
    "/auth/me",
    payload,
  );
  return data.data.user;
};
