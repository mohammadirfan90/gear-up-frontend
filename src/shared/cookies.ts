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
