import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findUnique,
  updateMany,
  userUpdate,
  deleteMany,
  transaction,
  securityEventCreate,
} = vi.hoisted(() => ({
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  userUpdate: vi.fn(),
  deleteMany: vi.fn(),
  transaction: vi.fn(),
  securityEventCreate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    passwordResetToken: {
      findUnique,
      updateMany,
      deleteMany,
    },
    user: {
      update: userUpdate,
    },
    $transaction: transaction,
    securityEvent: {
      create: securityEventCreate,
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed-password"),
  },
}));

const { consumeRateLimit } = vi.hoisted(() => ({
  consumeRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    remaining: 9,
    retryAfterSeconds: 60,
  }),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit,
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  rateLimitHeaders: vi.fn((result) => ({
    "Retry-After": String(result.retryAfterSeconds),
    "X-RateLimit-Remaining": String(result.remaining),
  })),
}));

import { POST } from "./route";

describe("POST /api/auth/reset-password", () => {

  beforeEach(() => {
    consumeRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 9,
      retryAfterSeconds: 60,
    });
  });

  it("returns 429 when rate limit is exceeded", async () => {
    consumeRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 120,
    });

    const request = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "a".repeat(64),
        password: "new-password-123",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body).toEqual({
      error: "Too many password reset attempts. Please try again later.",
    });
    expect(response.headers.get("Retry-After")).toBe("120");
  });

  beforeEach(() => {
    findUnique.mockReset();
    updateMany.mockReset();
    userUpdate.mockReset();
    deleteMany.mockReset();
    transaction.mockReset();
    securityEventCreate.mockReset();

    transaction.mockImplementation(async (callback) =>
      callback({
        passwordResetToken: {
          updateMany,
          deleteMany,
        },
        user: {
          update: userUpdate,
        },
      }),
    );
  });

  it("rejects invalid input", async () => {
    const request = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "short",
        password: "short",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("rejects a missing token", async () => {
    findUnique.mockResolvedValue(null);

    const request = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "a".repeat(64),
        password: "new-password-123",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("rejects an expired token", async () => {
    findUnique.mockResolvedValue({
      id: "token-1",
      userId: "user-1",
      expiresAt: new Date(Date.now() - 60_000),
      usedAt: null,
    });

    const request = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "a".repeat(64),
        password: "new-password-123",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("rejects an already-used token", async () => {
    findUnique.mockResolvedValue({
      id: "token-1",
      userId: "user-1",
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: new Date(),
    });

    const request = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "a".repeat(64),
        password: "new-password-123",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("resets the password and consumes the token atomically", async () => {
    findUnique.mockResolvedValue({
      id: "token-1",
      userId: "user-1",
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    });

    updateMany.mockResolvedValue({ count: 1 });
    userUpdate.mockResolvedValue({ id: "user-1" });
    deleteMany.mockResolvedValue({ count: 0 });

    const request = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "a".repeat(64),
        password: "new-password-123",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      message: "Your password has been reset successfully.",
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: "token-1",
        usedAt: null,
        expiresAt: expect.any(Object),
      },
      data: { usedAt: expect.any(Date) },
    });
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        passwordHash: "hashed-password",
        authVersion: { increment: 1 },
      },
    });
    expect(securityEventCreate).toHaveBeenCalledWith({
      data: {
        type: "PASSWORD_RESET_COMPLETE",
        outcome: "SUCCESS",
        userId: "user-1",
        ipAddress: null,
        userAgent: null,
        metadata: undefined,
      },
    });
  });

  it("fails when another request claims the token first", async () => {
    findUnique.mockResolvedValue({
      id: "token-1",
      userId: "user-1",
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    });

    updateMany.mockResolvedValue({ count: 0 });

    const request = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "a".repeat(64),
        password: "new-password-123",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(userUpdate).not.toHaveBeenCalled();
  });
});
