import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/auth";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitHeaders,
} from "@/lib/security/rate-limit";

const { GET, POST: authPost } = handlers;

export { GET };

export async function POST(request: NextRequest) {
  const pathname = new URL(request.url).pathname;

  if (!pathname.endsWith("/callback/credentials")) {
    return authPost(request);
  }

  let email = "";

  try {
    const body = await request.clone().formData();
    email = body.get("email")?.toString().trim().toLowerCase() ?? "";
  } catch {
    // Auth.js will handle malformed credentials requests.
  }

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

  return authPost(request);
}
