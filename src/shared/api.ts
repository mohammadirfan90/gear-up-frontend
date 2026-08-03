import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from "axios";
import {
  getTokenCookie,
  removeTokenCookies,
  setTokenCookie,
} from "./cookies";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface RefreshResponse {
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
  withCredentials: true,
});

let refreshRequest: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getTokenCookie(true);
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await axios.post<ApiEnvelope<RefreshResponse>>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
      },
    );

    const { accessToken, refreshToken: nextRefreshToken } = response.data.data.tokens;
    setTokenCookie(accessToken);
    setTokenCookie(nextRefreshToken, true);
    return accessToken;
  } catch {
    removeTokenCookies();
    return null;
  }
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = getTokenCookie();
  if (accessToken) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    config.headers = headers;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    refreshRequest ??= refreshAccessToken().finally(() => {
      refreshRequest = null;
    });

    const accessToken = await refreshRequest;
    if (!accessToken) {
      return Promise.reject(error);
    }

    const headers = AxiosHeaders.from(originalRequest.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    originalRequest.headers = headers;
    return api(originalRequest);
  },
);

export default api;
export { API_BASE_URL };
export type { ApiEnvelope };
