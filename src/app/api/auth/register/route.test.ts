import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { userFindUnique, userCreate, rateLimit } = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: userFindUnique,
      create: userCreate,
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed-password"),
  },
}));

vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: rateLimit,
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  rateLimitHeaders: vi.fn((result) => ({
    "Retry-After": String(result.retryAfterSeconds),
    "X-RateLimit-Remaining": String(result.remaining),
  })),
}));

import { POST } from "./route";

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    rateLimit.mockResolvedValue({
      allowed: true,
      remaining: 4,
      retryAfterSeconds: 900,
    });
    userFindUnique.mockReset();
    userCreate.mockReset();
  });

  it("rejects registration when the IP rate limit is exceeded", async () => {
    rateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 120,
    });

    const request = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "user@example.com",
        password: "password-123",
        name: "Test User",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body).toEqual({
      ok: false,
      error: "Too many registration attempts. Please try again later.",
    });
    expect(response.headers.get("Retry-After")).toBe("120");
    expect(userFindUnique).not.toHaveBeenCalled();
    expect(userCreate).not.toHaveBeenCalled();
  });

  it("continues with normal registration when the rate limit allows it", async () => {
    userFindUnique.mockResolvedValue(null);
    userCreate.mockResolvedValue({ id: "user-1" });

    const request = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "USER@EXAMPLE.COM",
        password: "password-123",
        name: "Test User",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ ok: true });
    expect(rateLimit).toHaveBeenCalledWith({
      namespace: "auth:register:ip",
      identifier: "127.0.0.1",
      limit: 5,
      windowSeconds: 900,
    });
    expect(userFindUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
    });
  });
});
