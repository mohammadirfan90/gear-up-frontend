import { NextRequest, NextResponse } from "next/server";
import { decodeJwt, isJwtExpired } from "@/shared/jwt";

const ACCESS_TOKEN_COOKIE = "gearup_access_token";
const REFRESH_TOKEN_COOKIE = "gearup_refresh_token";

const ROLE_PROTECTED_PREFIXES: Array<{
  prefix: string;
  roles: Array<"customer" | "provider" | "admin">;
}> = [
  { prefix: "/dashboard/customer", roles: ["customer"] },
  { prefix: "/dashboard/provider", roles: ["provider"] },
  { prefix: "/dashboard/admin", roles: ["admin"] },
];

const AUTH_PATHS = ["/auth/login", "/auth/register"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  const payload = decodeJwt(accessToken ?? "");
  const hasValidAccess = !!accessToken && !isJwtExpired(payload);
  const hasValidRefresh = !!refreshToken;

  const isProtected = ROLE_PROTECTED_PREFIXES.some(({ prefix }) =>
    pathname.startsWith(prefix),
  );

  if (isProtected && !hasValidAccess) {
    if (hasValidRefresh) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("next", pathname + search);
      url.searchParams.set("reason", "expired");
      return NextResponse.redirect(url);
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  if (isProtected && hasValidAccess && payload?.role) {
    const match = ROLE_PROTECTED_PREFIXES.find(({ prefix }) =>
      pathname.startsWith(prefix),
    );
    if (match && !match.roles.includes(payload.role)) {
      const target = roleHome(payload.role);
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = target;
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  const isAuthPage = AUTH_PATHS.includes(pathname);
  if (isAuthPage && hasValidAccess && payload?.role) {
    const home = request.nextUrl.clone();
    home.pathname = roleHome(payload.role);
    home.search = "";
    return NextResponse.redirect(home);
  }

  return NextResponse.next();
}

const roleHome = (role: "customer" | "provider" | "admin"): string => {
  switch (role) {
    case "customer":
      return "/dashboard/customer";
    case "provider":
      return "/dashboard/provider";
    case "admin":
      return "/dashboard/admin";
    default:
      return "/";
  }
};

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/login",
    "/auth/register",
  ],
};
