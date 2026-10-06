import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { userFindUnique, userCreate, securityEventCreate, rateLimit } =
  vi.hoisted(() => ({
    userFindUnique: vi.fn(),
    userCreate: vi.fn(),
    securityEventCreate: vi.fn(),
    rateLimit: vi.fn(),
  }));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: userFindUnique,
      create: userCreate,
    },
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
    securityEventCreate.mockReset();
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
      error: "Too many registration attempts. Please try again later.",
    });
    expect(response.headers.get("Retry-After")).toBe("120");
    expect(userFindUnique).not.toHaveBeenCalled();
    expect(userCreate).not.toHaveBeenCalled();
    expect(securityEventCreate).toHaveBeenCalledWith({
      data: {
        type: "AUTH_REGISTER",
        outcome: "FAILURE",
        userId: null,
        ipAddress: null,
        userAgent: null,
        metadata: undefined,
      },
    });
  });

  it("does not reveal whether an email already has an account", async () => {
    userFindUnique.mockResolvedValue({ id: "existing-user" });

    const request = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "existing@example.com",
        password: "password-123",
        name: "Existing User",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      ok: true,
      message:
        "If an account can be created with this email, the next step is ready.",
    });
    expect(userCreate).not.toHaveBeenCalled();
  });

  it("returns identical public responses for existing and newly created accounts", async () => {
    const makeRequest = () =>
      new NextRequest("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "password-123",
          name: "Test User",
        }),
      });

    userFindUnique.mockResolvedValueOnce({ id: "existing-user" });
    const existingResponse = await POST(makeRequest());
    const existingBody = await existingResponse.text();

    expect(userCreate).not.toHaveBeenCalled();

    userFindUnique.mockResolvedValueOnce(null);
    userCreate.mockResolvedValueOnce({ id: "new-user" });
    const createdResponse = await POST(makeRequest());
    const createdBody = await createdResponse.text();

    expect(userCreate).toHaveBeenCalledTimes(1);
    expect(existingResponse.status).toBe(201);
    expect(createdResponse.status).toBe(existingResponse.status);
    expect(createdResponse.headers.get("Content-Type")).toBe(
      existingResponse.headers.get("Content-Type"),
    );
    expect(createdBody).toBe(existingBody);
    expect(JSON.parse(createdBody)).toEqual({
      ok: true,
      message:
        "If an account can be created with this email, the next step is ready.",
    });
  });

  it("accepts an email collision caused by concurrent registration", async () => {
    userFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "concurrent-user" });
    userCreate.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    const response = await POST(
      new NextRequest("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "password-123",
          name: "Test User",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      ok: true,
      message:
        "If an account can be created with this email, the next step is ready.",
    });
    expect(userFindUnique).toHaveBeenCalledTimes(2);
    expect(userFindUnique).toHaveBeenLastCalledWith({
      where: { email: "user@example.com" },
    });
    expect(userCreate).toHaveBeenCalledTimes(1);
    expect(securityEventCreate).not.toHaveBeenCalled();
  });

  it.each(["database", "unrelated uniqueness"] as const)(
    "does not mask a %s failure as accepted registration",
    async (failure) => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      userFindUnique.mockResolvedValue(null);
      userCreate.mockRejectedValueOnce(
        failure === "database"
          ? new Error("Database unavailable")
          : new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
              code: "P2002",
              clientVersion: "test",
            }),
      );

      try {
        const response = await POST(
          new NextRequest("http://localhost/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: "user@example.com",
              password: "password-123",
              name: "Test User",
            }),
          }),
        );

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
          error: "Something went wrong. Please try again later.",
        });
        expect(securityEventCreate).not.toHaveBeenCalled();
      } finally {
        vi.restoreAllMocks();
      }
    },
  );

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
    expect(body).toEqual({
      ok: true,
      message:
        "If an account can be created with this email, the next step is ready.",
    });
    expect(rateLimit).toHaveBeenCalledWith({
      namespace: "auth:register:ip",
      identifier: "127.0.0.1",
      limit: 5,
      windowSeconds: 900,
    });
    expect(userFindUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
    });
    expect(securityEventCreate).toHaveBeenCalledWith({
      data: {
        type: "AUTH_REGISTER",
        outcome: "SUCCESS",
        userId: "user-1",
        ipAddress: null,
        userAgent: null,
        metadata: undefined,
      },
    });
  });
});
