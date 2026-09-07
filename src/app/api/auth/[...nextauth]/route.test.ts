import { beforeEach, describe, expect, it, vi } from "vitest";

const { authPost, authGet, consumeRateLimit, headers } = vi.hoisted(() => ({
  authPost: vi.fn(),
  authGet: vi.fn(),
  consumeRateLimit: vi.fn(),
  headers: vi.fn((result) => ({
    "Retry-After": String(result.retryAfterSeconds),
    "X-RateLimit-Remaining": String(result.remaining),
  })),
}));

vi.mock("@/auth", () => ({
  handlers: {
    GET: authGet,
    POST: authPost,
  },
}));

vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit,
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  rateLimitHeaders: headers,
}));

import { GET, POST } from "./route";

describe("/api/auth/[...nextauth]", () => {
  beforeEach(() => {
    authPost.mockReset();
    authGet.mockReset();
    consumeRateLimit.mockReset();
    headers.mockClear();

    authPost.mockResolvedValue(new Response("auth-post"));
    authGet.mockResolvedValue(new Response("auth-get"));
    consumeRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 19,
      retryAfterSeconds: 900,
    });
  });

  it("passes non-credentials POSTs directly to Auth.js", async () => {
    const request = new Request(
      "http://localhost/api/auth/signout",
      { method: "POST" },
    );

    const response = await POST(request as never);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("auth-post");
    expect(authPost).toHaveBeenCalledTimes(1);
    expect(consumeRateLimit).not.toHaveBeenCalled();
  });

  it("blocks credentials login when the IP limit is exceeded", async () => {
    consumeRateLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 300,
    });

    const request = new Request(
      "http://localhost/api/auth/callback/credentials",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: "user@example.com",
          password: "wrong-password",
        }),
      },
    );

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body).toEqual({
      error: "Too many login attempts. Please try again later.",
    });
    expect(response.headers.get("Retry-After")).toBe("300");
    expect(authPost).not.toHaveBeenCalled();
  });

  it("applies both IP and account limits to credentials login", async () => {
    consumeRateLimit
      .mockResolvedValueOnce({
        allowed: true,
        remaining: 19,
        retryAfterSeconds: 900,
      })
      .mockResolvedValueOnce({
        allowed: true,
        remaining: 4,
        retryAfterSeconds: 900,
      });

    const request = new Request(
      "http://localhost/api/auth/callback/credentials",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: "USER@EXAMPLE.COM",
          password: "password-123",
        }),
      },
    );

    const response = await POST(request as never);

    expect(await response.text()).toBe("auth-post");
    expect(authPost).toHaveBeenCalledTimes(1);
    expect(consumeRateLimit).toHaveBeenNthCalledWith(1, {
      namespace: "auth:login:ip",
      identifier: "127.0.0.1",
      limit: 20,
      windowSeconds: 900,
    });
    expect(consumeRateLimit).toHaveBeenNthCalledWith(2, {
      namespace: "auth:login:account",
      identifier: "user@example.com:127.0.0.1",
      limit: 5,
      windowSeconds: 900,
    });
  });

  it("blocks credentials login when the account limit is exceeded", async () => {
    consumeRateLimit
      .mockResolvedValueOnce({
        allowed: true,
        remaining: 19,
        retryAfterSeconds: 900,
      })
      .mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        retryAfterSeconds: 420,
      });

    const request = new Request(
      "http://localhost/api/auth/callback/credentials",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: "user@example.com",
          password: "wrong-password",
        }),
      },
    );

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body).toEqual({
      error: "Too many login attempts. Please try again later.",
    });
    expect(response.headers.get("Retry-After")).toBe("420");
    expect(authPost).not.toHaveBeenCalled();
  });

  it("delegates GET requests to Auth.js", async () => {
    const request = new Request("http://localhost/api/auth/session");

    const response = await GET(request as never);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("auth-get");
    expect(authGet).toHaveBeenCalledTimes(1);
  });
});
