import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "./lib/session";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/alerts",
  "/logs",
  "/analysis",
  "/simulation",
  "/response",
  "/profile",
  "/attacks",
];

function isProtectedPath(pathname) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (session) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/alerts/:path*",
    "/logs/:path*",
    "/analysis/:path*",
    "/simulation/:path*",
    "/response/:path*",
    "/profile/:path*",
    "/attacks/:path*",
  ],
};
