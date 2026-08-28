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
import { applyCsrfHeader } from "./csrf";

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
        withCredentials: true,
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
  const headers = AxiosHeaders.from(config.headers);
  const accessToken = getTokenCookie();
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  // Forward-compatible double-submit CSRF: attaches X-CSRF-Token only when
  // the server has already set XSRF-TOKEN. No-ops harmlessly otherwise.
  applyCsrfHeader(config.method, headers);
  config.headers = headers;
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
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    // Endpoints that must never trigger a refresh-and-retry. A 401 from any
    // of these means the user's credentials are simply invalid or they are
    // not logged in — retrying can't fix that, and we don't want the retry
    // path (or a subsequent re-throw) to be mistaken for a missing route.
    const url = originalRequest.url ?? "";
    if (
      url.includes("/auth/refresh") ||
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/me")
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

    // Build a clean retry config so the method and body cannot be lost
    // when axios re-serializes the config object.
    const retryConfig: InternalAxiosRequestConfig = {
      ...originalRequest,
      method: (originalRequest.method ?? "get").toLowerCase() as InternalAxiosRequestConfig["method"],
      headers: AxiosHeaders.from(originalRequest.headers),
    };
    const headers = AxiosHeaders.from(retryConfig.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    retryConfig.headers = headers;
    return api.request(retryConfig);
  },
);

export default api;
export { API_BASE_URL };
export type { ApiEnvelope };
