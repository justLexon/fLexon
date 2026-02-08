import { NextResponse } from "next/server";

const PROTECTED_PATHS = ["/pages/dashboard", "/pages/stats"];

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("flexon_token")?.value;

  if (pathname === "/" && token) {
    const url = request.nextUrl.clone();
    url.pathname = "/pages/dashboard";
    return NextResponse.redirect(url);
  }

  if (PROTECTED_PATHS.some((path) => pathname.startsWith(path)) && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/pages/:path*"],
};
