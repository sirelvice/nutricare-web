// Import NextResponse to control middleware behavior (redirect, continue, etc.)
import { NextResponse } from "next/server";

// Import NextRequest type for proper typing
import type { NextRequest } from "next/server";

/**
 * Checks whether the request contains a valid session cookie.
 * Supports:
 * - NextAuth v5 (Auth.js)
 * - Older NextAuth v4 cookie names (fallback support)
 */
function hasSessionCookie(req: NextRequest) {
  // NextAuth v5 (Auth.js) cookie names:
  // - Development / HTTP: authjs.session-token
  // - Production / HTTPS: __Secure-authjs.session-token
  const v5 =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value;

  // Support older NextAuth v4 cookie names for backward compatibility:
  // - Development / HTTP: next-auth.session-token
  // - Production / HTTPS: __Secure-next-auth.session-token
  const v4 =
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  // Return true if any valid session cookie exists
  return Boolean(v5 || v4);
}

/**
 * Middleware function that protects specific application routes.
 * Redirects unauthenticated users to /login.
 */
export function middleware(req: NextRequest) {
  // Get the requested pathname (e.g., "/dashboard/settings")
  const pathname = req.nextUrl.pathname;

  // Determine if the route is one of the protected app routes
  const isAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/tools") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/report") ||
    pathname.startsWith("/profile");

  // If the route is not protected, allow the request to continue
  if (!isAppRoute) return NextResponse.next();

  // Check if the user has a valid session cookie
  const loggedIn = hasSessionCookie(req);

  // If the user is not logged in, redirect to /login
  if (!loggedIn) {
    // Clone the current URL to modify it safely
    const url = req.nextUrl.clone();

    // Set redirect destination to login page
    url.pathname = "/login";

    // Preserve the originally requested path
    // so we can redirect back after successful login
    url.searchParams.set("next", pathname);

    return NextResponse.redirect(url);
  }

  // If authenticated, allow the request to proceed
  return NextResponse.next();
}

// Configure which routes this middleware should run on
export const config = {
  matcher: [
    "/dashboard/:path*", // Protect all dashboard routes
    "/profile/:path*",   // Protect all profile routes
    "/tools/:path*",     // Protect all tools routes
    "/history/:path*",   // Protect all history routes
    "/report/:path*",    // Protect all report routes
  ],
};
