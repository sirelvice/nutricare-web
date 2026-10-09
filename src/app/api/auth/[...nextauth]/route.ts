import { readCredentialsRequest } from "@/lib/security/read-credentials-request";
import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/auth";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";

const { GET: authGet, POST: authPost } = handlers;

export async function GET(request: NextRequest) {
  const response = await authGet(request);
  if (new URL(request.url).pathname !== "/api/auth/session") return response;

  // Auth.js can mint a CSRF cookie during a session read. Concurrent initial
  // session reads can overwrite the cookie used by an in-flight /csrf request.
  // Only /csrf should issue that cookie here; session refresh cookies and every
  // other header remain intact. POST validation still runs inside Auth.js.
  const cookies = response.headers.getSetCookie();
  const remaining = cookies.filter((cookie) =>
    !/^(?:__Host-)?authjs\.csrf-token=/.test(cookie),
  );
  if (remaining.length === cookies.length) return response;

  const headers = new Headers(response.headers);
  headers.delete("set-cookie");
  for (const cookie of remaining) headers.append("set-cookie", cookie);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function POST(request: NextRequest) {
  const pathname = new URL(request.url).pathname;

  if (!pathname.endsWith("/callback/credentials")) {
    return authPost(request);
  }

  const bounded = await readCredentialsRequest(request);
  if (!bounded.ok) return bounded.response;
  const { email } = bounded;

  const ip = getClientIp(request);

  const ipLimit = await consumeRateLimit({
    namespace: "auth:login:ip",
    identifier: ip,
    limit: 20,
    windowSeconds: 15 * 60,
  });

  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: rateLimitHeaders(ipLimit) },
    );
  }

  if (email) {
    const accountLimit = await consumeRateLimit({
      namespace: "auth:login:account",
      identifier: `${email}:${ip}`,
      limit: 5,
      windowSeconds: 15 * 60,
    });

    if (!accountLimit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: rateLimitHeaders(accountLimit) },
      );
    }
  }

  return authPost(bounded.request);
}
