// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/profile",
  "/tools",
  "/history",
  "/report",
];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow Next internals + static files + API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/brand/") ||
    pathname.startsWith("/api/")
  ) {
    return NextResponse.next();
  }

  // Only guard protected routes
  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  // Check session
  const session = await auth();
  if (!session?.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/tools/:path*",
    "/history/:path*",
    "/report/:path*",
  ],
};