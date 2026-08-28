/**
 * Server-side source of truth for the authenticated user.
 *
 * These helpers run inside Next.js server components / route handlers. They
 * read the access token from the request cookies via `next/headers` — which
 * works for HttpOnly cookies that JavaScript can never see — and call
 * `/auth/me` to resolve the current user. Authorization decisions MUST go
 * through these helpers rather than trusting the unsigned JWT payload.
 *
 * The frontend's `proxy.ts` middleware does not (and cannot) verify the JWT
 * signature, so any role or identity it reads from the cookie payload is
 * attacker-controlled. The server-side fetch here is the only place where
 * "what role is this user" can be answered reliably.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ACCESS_TOKEN_COOKIE = "gearup_access_token";

export type AuthRole = "customer" | "provider" | "admin";
export type AuthStatus = "active" | "suspended";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  status: AuthStatus;
}

interface MeEnvelope {
  success: boolean;
  message: string;
  data: { user: AuthUser };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api";

const loginRedirectFor = (returnTo: string) =>
  `/auth/login?next=${encodeURIComponent(returnTo)}`;

const homeForRole = (role: AuthRole): string => {
  switch (role) {
    case "customer":
      return "/dashboard/customer";
    case "provider":
      return "/dashboard/provider";
    case "admin":
      return "/dashboard/admin";
  }
};

/**
 * Ensures a valid session exists, otherwise redirects to `/auth/login`
 * with a `next` parameter that returns the user to the current page.
 *
 * Always returns a typed AuthUser — never `null`/`undefined`.
 */
export async function requireUser(returnTo: string): Promise<AuthUser> {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) redirect(loginRedirectFor(returnTo));

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) redirect(loginRedirectFor(returnTo));
    const json = (await res.json()) as MeEnvelope;
    const user = json?.data?.user;
    if (!user?.role) redirect(loginRedirectFor(returnTo));
    return user;
  } catch {
    redirect(loginRedirectFor(returnTo));
  }
}

/**
 * Ensures the current user has the specified role. Wrong-role users are
 * redirected to their own role's dashboard.
 */
export async function requireRole(
  role: AuthRole,
  returnTo: string,
): Promise<AuthUser> {
  const user = await requireUser(returnTo);
  if (user.role !== role) {
    redirect(homeForRole(user.role));
  }
  return user;
}
