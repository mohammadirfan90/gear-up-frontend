import { NextRequest, NextResponse } from "next/server";
import { decodeJwt, isJwtExpired } from "@/shared/jwt";

const ACCESS_TOKEN_COOKIE = "gearup_access_token";
const REFRESH_TOKEN_COOKIE = "gearup_refresh_token";

const ROLE_PROTECTED_PREFIXES = [
  "/dashboard/customer",
  "/dashboard/provider",
  "/dashboard/admin",
] as const;

const AUTH_PATHS = ["/auth/login", "/auth/register"];

/**
 * Edge middleware. SECURITY NOTE: this layer runs on the Edge runtime and
 * CANNOT verify the JWT signature — it only base64-decodes the payload.
 * That means any role or identity claim read from the cookie here is
 * attacker-controlled and MUST NOT be used for security decisions.
 *
 * What this layer is allowed to do:
 *  - Detect that an access token cookie is present and not expired (UX
 *    hint for routing).
 *  - Redirect unauthenticated users away from `/dashboard/*` to login.
 *  - Redirect already-authenticated users away from `/auth/login` to a
 *    role-default landing page (best-effort).
 *
 * What this layer MUST NOT do:
 *  - Trust the `role` claim from the cookie to gate access. That is now
 *    handled server-side in `src/app/dashboard/<role>/layout.tsx` via
 *    `requireRole()`, which calls `/auth/me` (a signature-verified source
 *    of truth) and cannot be bypassed by cookie tampering.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  const payload = decodeJwt(accessToken ?? "");
  const hasUsableAccess = !!accessToken && !isJwtExpired(payload);

  const isProtected = ROLE_PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isProtected && !hasUsableAccess) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("next", pathname + search);
    if (refreshToken) {
      loginUrl.searchParams.set("reason", "expired");
    }
    return NextResponse.redirect(loginUrl);
  }

  const isAuthPage = AUTH_PATHS.includes(pathname);
  if (isAuthPage && hasUsableAccess) {
    // UX hint only. Real role enforcement is in the server-side dashboard
    // layout; this just avoids showing the login form to a logged-in user.
    const role = payload?.role;
    const home = request.nextUrl.clone();
    home.pathname =
      role === "customer"
        ? "/dashboard/customer"
        : role === "provider"
          ? "/dashboard/provider"
          : role === "admin"
            ? "/dashboard/admin"
            : "/";
    home.search = "";
    return NextResponse.redirect(home);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/login",
    "/auth/register",
  ],
};
