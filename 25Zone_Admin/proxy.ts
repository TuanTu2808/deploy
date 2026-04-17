import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const LOGIN_PATH = "/admin/login";
const DASHBOARD_PATH = "/admin/dashboard";
const ADMIN_TOKEN_COOKIE = "admin_token";
const ADMIN_REFRESH_TOKEN_COOKIE = "admin_refresh_token";
const ADMIN_ROLE_COOKIE = "admin_role";

const isAuthenticatedAdmin = (request: NextRequest) => {
  const accessToken = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(ADMIN_REFRESH_TOKEN_COOKIE)?.value;
  const role = request.cookies.get(ADMIN_ROLE_COOKIE)?.value;

  return role === "admin" && (Boolean(accessToken) || Boolean(refreshToken));
};

export function proxy(request: NextRequest) {
  const { pathname, searchParams, search } = request.nextUrl;
  const hasAdminSession = isAuthenticatedAdmin(request);

  if (pathname === "/") {
    const target = hasAdminSession ? DASHBOARD_PATH : LOGIN_PATH;
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const isLoginPage = pathname === LOGIN_PATH;

  if (isLoginPage && hasAdminSession) {
    const nextPath = searchParams.get("next");
    const target =
      nextPath && nextPath.startsWith("/admin") && nextPath !== LOGIN_PATH
        ? nextPath
        : DASHBOARD_PATH;
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (!isLoginPage && !hasAdminSession) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    const requestedPath = `${pathname}${search || ""}`;
    loginUrl.searchParams.set("next", requestedPath);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*"],
};
