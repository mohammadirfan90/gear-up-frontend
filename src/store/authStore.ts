import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import api, { type ApiEnvelope } from "@/shared/api";
import {
  getTokenCookie,
  removeTokenCookies,
  setTokenCookie,
} from "@/shared/cookies";

export type UserRole = "customer" | "provider" | "admin";
export type UserStatus = "active" | "suspended";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  fetchProfile: () => Promise<AuthUser | null>;
  reset: () => void;
  setUser: (user: AuthUser | null) => void;
}

const persistTokens = (tokens: AuthTokens) => {
  setTokenCookie(tokens.accessToken);
  setTokenCookie(tokens.refreshToken, true);
};

const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isInitializing: true,
      error: null,

      initialize: async () => {
        if (!getTokenCookie()) {
          set({ isInitializing: false, isAuthenticated: false, user: null });
          return;
        }

        try {
          await get().fetchProfile();
        } catch {
          set({ isAuthenticated: false, user: null });
        } finally {
          set({ isInitializing: false });
        }
      },

      login: async ({ email, password }) => {
        set({ error: null });
        try {
          const { data } = await api.post<ApiEnvelope<{ user: AuthUser; tokens: AuthTokens }>>(
            "/auth/login",
            { email, password },
          );
          persistTokens(data.data.tokens);
          set({ user: data.data.user, isAuthenticated: true, error: null });
          return data.data.user;
        } catch (err) {
          const message = extractErrorMessage(err, "Unable to sign in. Please try again.");
          set({ error: message });
          throw new Error(message);
        }
      },

      register: async (payload) => {
        set({ error: null });
        try {
          const { data } = await api.post<ApiEnvelope<{ user: AuthUser; tokens: AuthTokens }>>(
            "/auth/register",
            payload,
          );
          persistTokens(data.data.tokens);
          set({ user: data.data.user, isAuthenticated: true, error: null });
          return data.data.user;
        } catch (err) {
          const message = extractErrorMessage(
            err,
            "Registration failed. Please review your details and try again.",
          );
          set({ error: message });
          throw new Error(message);
        }
      },

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch {
          /* ignore logout API errors — local cleanup still runs */
        } finally {
          removeTokenCookies();
          set({ user: null, isAuthenticated: false, error: null });
        }
      },

      refresh: async () => {
        const refreshToken = getTokenCookie(true);
        if (!refreshToken) {
          set({ isAuthenticated: false, user: null });
          return false;
        }
        try {
          const { data } = await api.post<ApiEnvelope<{ tokens: AuthTokens }>>(
            "/auth/refresh",
            { refreshToken },
          );
          persistTokens(data.data.tokens);
          return true;
        } catch {
          removeTokenCookies();
          set({ isAuthenticated: false, user: null });
          return false;
        }
      },

      fetchProfile: async () => {
        try {
          const { data } = await api.get<ApiEnvelope<{ user: AuthUser }>>(
            "/auth/me",
          );
          set({ user: data.data.user, isAuthenticated: true, error: null });
          return data.data.user;
        } catch (err) {
          const message = extractErrorMessage(err, "Unable to load profile.");
          set({ error: message, isAuthenticated: false, user: null });
          return null;
        }
      },

      reset: () => {
        removeTokenCookies();
        set({ user: null, isAuthenticated: false, error: null });
      },

      setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
    }),
    {
      name: "gearup-auth",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          };
        }
        return window.localStorage;
      }),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        if (state?.isAuthenticated && !getTokenCookie()) {
          state.isAuthenticated = false;
          state.user = null;
        }
      },
    },
  ),
);
