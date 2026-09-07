import { createHmac, randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || "unknown";
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "Retry-After": String(result.retryAfterSeconds),
    "X-RateLimit-Remaining": String(result.remaining),
  };
}

type ConsumeRateLimitInput = {
  namespace: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
};

function getHashSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (secret) return secret;

  if (process.env.NODE_ENV === "test") {
    return "nutricare-test-rate-limit-secret";
  }

  throw new Error("Auth secret is not configured.");
}

function hashKey(namespace: string, identifier: string) {
  return createHmac("sha256", getHashSecret())
    .update(`${namespace}:${identifier}`)
    .digest("hex");
}

function getWindowStart(now: Date, windowSeconds: number) {
  const windowMs = windowSeconds * 1000;
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

export async function consumeRateLimit({
  namespace,
  identifier,
  limit,
  windowSeconds,
}: ConsumeRateLimitInput): Promise<RateLimitResult> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("Rate limit must be a positive integer.");
  }

  if (!Number.isInteger(windowSeconds) || windowSeconds < 1) {
    throw new Error("Rate limit window must be a positive integer.");
  }

  const now = new Date();
  const windowStart = getWindowStart(now, windowSeconds);
  const keyHash = hashKey(namespace, identifier);

  const rows = await prisma.$queryRaw<
    Array<{ count: number; windowStart: Date }>
  >`
    INSERT INTO "RateLimitBucket"
      ("id", "keyHash", "windowStart", "count", "createdAt", "updatedAt")
    VALUES
      (
        ${randomUUID()},
        ${keyHash},
        ${windowStart},
        1,
        NOW(),
        NOW()
      )
    ON CONFLICT ("keyHash") DO UPDATE
    SET
      "windowStart" = EXCLUDED."windowStart",
      "count" = CASE
        WHEN "RateLimitBucket"."windowStart" = EXCLUDED."windowStart"
          THEN LEAST("RateLimitBucket"."count" + 1, ${limit + 1})
        ELSE 1
      END,
      "updatedAt" = NOW()
    RETURNING "count", "windowStart"
  `;

  const bucket = rows[0];
  if (!bucket) {
    throw new Error("Rate limit operation returned no bucket.");
  }

  const windowEndMs = bucket.windowStart.getTime() + windowSeconds * 1000;
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((windowEndMs - now.getTime()) / 1000),
  );

  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds,
  };
}

export async function cleanupRateLimitBuckets() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  await prisma.rateLimitBucket.deleteMany({
    where: {
      updatedAt: { lt: cutoff },
    },
  });
}
