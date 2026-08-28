import { create } from "zustand";
import api, { type ApiEnvelope } from "@/shared/api";
import {
  getTokenCookie,
  removeTokenCookies,
  setTokenCookie,
} from "@/shared/cookies";
import { getApiErrorMessage } from "@/shared/apiError";

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

const extractErrorMessage = (err: unknown, fallback: string): string =>
  getApiErrorMessage(err, fallback);

/**
 * Auth store.
 *
 * SECURITY: this store does NOT use `zustand/middleware`'s `persist`. The
 * previous implementation wrote `user` and `isAuthenticated` to
 * `localStorage` under `gearup-auth`, which (a) put PII (email, role, id)
 * at the disposal of any XSS payload and (b) created a stable client-side
 * exfiltration surface. We now treat the server as the source of truth:
 * `isInitializing` starts true, `AuthInitializer` triggers
 * `initialize()`, and `initialize()` resolves truth from `/auth/me` via the
 * access-token cookie. A first-paint shimmer (already wired in the Navbar
 * and sidebar) handles the brief gap before the network call resolves.
 */
export const useAuthStore = create<AuthState>()((set, get) => ({
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
      // Clear any stale auth state so a failed login doesn't leave the
      // user in an inconsistent "authenticated but token-less" state.
      removeTokenCookies();
      set({ user: null, isAuthenticated: false });
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
      // Registration failed — make sure stale state from a previous
      // session can't masquerade as the new identity.
      removeTokenCookies();
      set({ user: null, isAuthenticated: false });
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
}));
