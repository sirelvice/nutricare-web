import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryRaw, deleteMany } = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: queryRaw,
    rateLimitBucket: {
      deleteMany,
    },
  },
}));

import {
  cleanupRateLimitBuckets,
  consumeRateLimit,
} from "./rate-limit";

describe("consumeRateLimit", () => {
  beforeEach(() => {
    queryRaw.mockReset();
    deleteMany.mockReset();
  });

  it("allows requests within the limit", async () => {
    queryRaw.mockResolvedValue([
      {
        count: 3,
        windowStart: new Date("2026-09-07T10:00:00.000Z"),
      },
    ]);

    const result = await consumeRateLimit({
      namespace: "login",
      identifier: "127.0.0.1",
      limit: 5,
      windowSeconds: 900,
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it("blocks requests after the limit is exceeded", async () => {
    queryRaw.mockResolvedValue([
      {
        count: 6,
        windowStart: new Date("2026-09-07T10:00:00.000Z"),
      },
    ]);

    const result = await consumeRateLimit({
      namespace: "login",
      identifier: "127.0.0.1",
      limit: 5,
      windowSeconds: 900,
    });

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("rejects invalid limits", async () => {
    await expect(
      consumeRateLimit({
        namespace: "login",
        identifier: "127.0.0.1",
        limit: 0,
        windowSeconds: 900,
      }),
    ).rejects.toThrow("Rate limit must be a positive integer.");
  });

  it("cleans up stale buckets", async () => {
    deleteMany.mockResolvedValue({ count: 4 });

    await cleanupRateLimitBuckets();

    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        updatedAt: { lt: expect.any(Date) },
      },
    });
  });
});
