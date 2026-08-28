/**
 * Client-side cookie helpers for the access / refresh tokens.
 *
 * SECURITY: these cookies are intentionally NOT HttpOnly because the
 * current backend contract returns the tokens inside the JSON response
 * body of `/auth/login` and `/auth/refresh`, and `axios` is configured
 * with `withCredentials: true` so the browser will send them back on
 * subsequent requests. Writing them from JavaScript therefore makes them
 * readable by any script in the page origin — a known XSS risk.
 *
 * This is acceptable ONLY as a transitional measure. The migration path
 * is:
 *
 *   1. Backend starts setting `gearup_access_token` and
 *      `gearup_refresh_token` via `Set-Cookie` with `HttpOnly`, `Secure`,
 *      and `SameSite=Lax` (or `Strict` once we verify cross-site flows).
 *   2. The response body keeps returning the tokens for backward
 *      compatibility but the JS writes below become no-ops (the browser
 *      will use the server-set HttpOnly cookies instead).
 *   3. We delete this file and the JS-side persistence calls in
 *      `authStore.ts`, and rely on the server-side reader in
 *      `src/shared/serverAuth.ts` (which uses `next/headers` and can read
 *      HttpOnly cookies) for every protected route.
 *
 * Until step 1 ships, keep the `Secure` and `SameSite=Lax` attributes set
 * so the existing cookies have at least the standard browser-side
 * protections in production.
 */
import Cookies from "js-cookie";

const ACCESS_TOKEN_COOKIE = "gearup_access_token";
const REFRESH_TOKEN_COOKIE = "gearup_refresh_token";

const cookieOptions: Cookies.CookieAttributes = {
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  expires: 7,
  path: "/",
};

export const setTokenCookie = (token: string, isRefresh = false): void => {
  Cookies.set(
    isRefresh ? REFRESH_TOKEN_COOKIE : ACCESS_TOKEN_COOKIE,
    token,
    isRefresh ? { ...cookieOptions, expires: 30 } : cookieOptions,
  );
};

export const getTokenCookie = (isRefresh = false): string | undefined =>
  Cookies.get(isRefresh ? REFRESH_TOKEN_COOKIE : ACCESS_TOKEN_COOKIE);

export const removeTokenCookies = (): void => {
  Cookies.remove(ACCESS_TOKEN_COOKIE, { path: "/" });
  Cookies.remove(REFRESH_TOKEN_COOKIE, { path: "/" });
};

export const tokenCookieNames = {
  access: ACCESS_TOKEN_COOKIE,
  refresh: REFRESH_TOKEN_COOKIE,
} as const;
