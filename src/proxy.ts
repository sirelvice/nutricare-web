// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";   // Make sure this path is correct

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/profile",
  "/tools",
  "/history",
  "/report",
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static assets, Next.js internals, API routes, and auth-related pages
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/brand/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  ) {
    return NextResponse.next();
  }

  // Only apply protection to specific routes
  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  // Get session using NextAuth v5 method
  const session = await auth();

  if (!session?.user) {
    // Redirect to login and remember where user was trying to go
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);   // Optional: you can use this later for redirect after login
    return NextResponse.redirect(url);
  }

  // User is authenticated → allow access
  return NextResponse.next();
}

// Matcher configuration
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/tools/:path*",
    "/history/:path*",
    "/report/:path*",
  ],
};