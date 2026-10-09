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

  it.each(["authjs.csrf-token", "__Host-authjs.csrf-token"])(
    "prevents a session read from issuing %s while preserving other cookies",
    async (csrfName) => {
      const sessionCookie = "authjs.session-token.0=session-part; Path=/; HttpOnly; Expires=Wed, 21 Oct 2026 07:28:00 GMT";
      const callbackCookie = "authjs.callback-url=https%3A%2F%2Fnutricare.app; Path=/; HttpOnly";
      const responseHeaders = new Headers({
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
      });
      responseHeaders.append("Set-Cookie", `${csrfName}=token%7Chash; Path=/; HttpOnly`);
      responseHeaders.append("Set-Cookie", sessionCookie);
      responseHeaders.append("Set-Cookie", callbackCookie);
      authGet.mockResolvedValueOnce(new Response('{"user":null}', {
        status: 200, headers: responseHeaders,
      }));

      const response = await GET(new Request("https://nutricare.app/api/auth/session") as never);

      expect(response.headers.getSetCookie()).toEqual([sessionCookie, callbackCookie]);
      expect(response.headers.get("Cache-Control")).toBe("private, no-store");
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(await response.json()).toEqual({ user: null });
      expect(consumeRateLimit).not.toHaveBeenCalled();
    },
  );

  it("leaves CSRF issuance untouched on the CSRF endpoint", async () => {
    const issued = new Response('{"csrfToken":"token"}', {
      headers: { "Set-Cookie": "authjs.csrf-token=token%7Chash; Path=/; HttpOnly" },
    });
    authGet.mockResolvedValueOnce(issued);
    const response = await GET(new Request("http://localhost/api/auth/csrf") as never);
    expect(response).toBe(issued);
    expect(response.headers.getSetCookie()).toHaveLength(1);
    expect(await response.json()).toEqual({ csrfToken: "token" });
  });

  it("preserves session errors and the response body", async () => {
    authGet.mockResolvedValueOnce(new Response("session unavailable", {
      status: 500,
      headers: {
        "Set-Cookie": "authjs.csrf-token=token%7Chash; Path=/; HttpOnly",
        "Cache-Control": "no-store",
      },
    }));
    const response = await GET(new Request("http://localhost/api/auth/session") as never);
    expect(response.status).toBe(500);
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(await response.text()).toBe("session unavailable");
  });

  it("passes the credentials body and CSRF token unchanged to Auth.js", async () => {
    const request = new Request("http://localhost/api/auth/callback/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        email: "user@example.com", password: "password-123", csrfToken: "test-token",
      }),
    });
    await POST(request as never);
    expect(authPost).toHaveBeenCalledOnce();
    const delegatedRequest = authPost.mock.calls[0][0] as Request;
    expect(delegatedRequest.url).toBe(request.url);
    expect(delegatedRequest.headers.get("Content-Type")).toBe(request.headers.get("Content-Type"));
    const delegated = new URLSearchParams(await delegatedRequest.text());
    expect(delegated.get("csrfToken")).toBe("test-token");
    expect(delegated.get("password")).toBe("password-123");
  });

  it.each([undefined, "1", "999999"])("rejects oversized credentials with declared length %s before Auth.js or database limits", async (declaredLength) => {
    const requestHeaders: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
    if (declaredLength) requestHeaders["Content-Length"] = declaredLength;
    const response = await POST(new Request("http://localhost/api/auth/callback/credentials", {
      method: "POST", headers: requestHeaders,
      body: new URLSearchParams({ email: "user@example.com", password: "x".repeat(17 * 1024) }),
    }) as never);
    expect(response.status).toBe(413);
    expect(authPost).not.toHaveBeenCalled();
    expect(consumeRateLimit).not.toHaveBeenCalled();
  });

  it("preserves cookie and CSRF bytes for Auth.js validation", async () => {
    const raw = "email=user%40example.com&password=p%2Bword&csrfToken=body-token";
    const request = new Request("http://localhost/api/auth/callback/credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: "authjs.csrf-token=cookie-token%7Chash",
        "X-Auth-Return-Redirect": "1",
      },
      body: raw,
    });
    await POST(request as never);
    const delegated = authPost.mock.calls[0][0] as Request;
    expect(delegated.headers.get("Cookie")).toBe(request.headers.get("Cookie"));
    expect(delegated.headers.get("X-Auth-Return-Redirect")).toBe("1");
    expect(await delegated.text()).toBe(raw);
  });

});
