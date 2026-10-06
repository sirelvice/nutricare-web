import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  findUnique,
  deleteMany,
  create,
  transaction,
  fetchMock,
  securityEventCreate,
} = vi.hoisted(() => ({
  findUnique: vi.fn(),
  deleteMany: vi.fn(),
  create: vi.fn(),
  transaction: vi.fn(),
  fetchMock: vi.fn(),
  securityEventCreate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique,
    },
    passwordResetToken: {
      deleteMany,
      create,
    },
    $transaction: transaction,
    securityEvent: {
      create: securityEventCreate,
    },
  },
}));

vi.stubGlobal("fetch", fetchMock);

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

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("CONTACT_FROM_EMAIL", "no-reply@nutricare.app");
    vi.stubEnv("APP_URL", "https://app.nutricare.app");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });


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

    const request = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body).toEqual({
      error: "Too many password reset requests. Please try again later.",
    });
    expect(response.headers.get("Retry-After")).toBe("120");
    expect(securityEventCreate).toHaveBeenCalledWith({
      data: {
        type: "PASSWORD_RESET_REQUEST",
        outcome: "FAILURE",
        userId: null,
        ipAddress: null,
        userAgent: null,
        metadata: undefined,
      },
    });
  });

  beforeEach(() => {
    findUnique.mockReset();
    deleteMany.mockReset();
    create.mockReset();
    transaction.mockReset();
    fetchMock.mockReset();
    securityEventCreate.mockReset();

    transaction.mockResolvedValue([]);
  });

  it("rejects an invalid email", async () => {
    const request = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("does not reveal whether an unknown email has an account", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.CONTACT_FROM_EMAIL = "no-reply@nutricare.app";
    findUnique.mockResolvedValue(null);

    const request = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "unknown@example.com" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(securityEventCreate).not.toHaveBeenCalled();
  });

  it("returns 503 when email delivery is not configured", async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.CONTACT_FROM_EMAIL;

    const request = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(503);
    expect(securityEventCreate).toHaveBeenCalledWith({
      data: {
        type: "PASSWORD_RESET_REQUEST",
        outcome: "FAILURE",
        userId: null,
        ipAddress: null,
        userAgent: null,
        metadata: undefined,
      },
    });
  });

  it("creates a reset token and sends the reset email", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.CONTACT_FROM_EMAIL = "no-reply@nutricare.app";
    process.env.APP_URL = "https://app.nutricare.app";

    findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    });

    transaction.mockResolvedValue([]);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: "email-1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const request = new Request("https://attacker.example/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "USER@EXAMPLE.COM" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const emailRequest = fetchMock.mock.calls[0];
    const emailOptions = emailRequest[1] as RequestInit;
    const emailBody = JSON.parse(String(emailOptions.body));

    expect(emailBody.to).toBe("user@example.com");
    expect(emailBody.subject).toBe("Reset your NutriCare password");
    expect(emailBody.html).toContain(
      "https://app.nutricare.app/reset-password?token=",
    );
    expect(emailBody.html).not.toContain("attacker.example");
    expect(securityEventCreate).toHaveBeenCalledWith({
      data: {
        type: "PASSWORD_RESET_REQUEST",
        outcome: "SUCCESS",
        userId: null,
        ipAddress: null,
        userAgent: null,
        metadata: undefined,
      },
    });
  });

  it.each([undefined, "invalid-url", "ftp://app.nutricare.app"])(
    "rejects invalid APP_URL configuration (%s) before account lookup",
    async (appUrl) => {
      vi.stubEnv("APP_URL", appUrl);
      const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
      findUnique.mockResolvedValue({
        id: "user-1",
        email: "user@example.com",
      });

      const request = new Request(
        "https://attacker.example/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "user@example.com" }),
        },
      );

      const response = await POST(request);

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error: "Unable to process the password reset request right now.",
      });
      expect(findUnique).not.toHaveBeenCalled();
      expect(transaction).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
      expect(deleteMany).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(errorLog).toHaveBeenCalledWith("Forgot-password route failed.");
      expect(securityEventCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "PASSWORD_RESET_REQUEST",
          outcome: "FAILURE",
        }),
      });
    },
  );

  it.each(["network", "provider", "cleanup"] as const)(
    "keeps the public response identical on %s failure",
    async (failure) => {
      const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
      const makeRequest = () =>
        new Request("https://nutricare.app/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "user@example.com" }),
        });

      findUnique.mockResolvedValueOnce(null);
      const unknownResponse = await POST(makeRequest());
      const unknownBody = await unknownResponse.text();

      expect(fetchMock).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();

      findUnique.mockResolvedValueOnce({
        id: "user-1",
        email: "user@example.com",
      });

      if (failure === "provider") {
        fetchMock.mockResolvedValueOnce(
          new Response("Provider unavailable", { status: 503 }),
        );
      } else {
        fetchMock.mockRejectedValueOnce(new Error("Resend failure"));
      }

      deleteMany.mockResolvedValueOnce({ count: 0 });
      if (failure === "cleanup") {
        deleteMany.mockRejectedValueOnce(new Error("Cleanup failed"));
      } else {
        deleteMany.mockResolvedValueOnce({ count: 1 });
      }

      const failedResponse = await POST(makeRequest());
      const failedBody = await failedResponse.text();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(transaction).toHaveBeenCalledTimes(1);
      expect(unknownResponse.status).toBe(200);
      expect(failedResponse.status).toBe(unknownResponse.status);
      expect(failedResponse.headers.get("Content-Type")).toBe(
        unknownResponse.headers.get("Content-Type"),
      );
      expect(failedBody).toBe(unknownBody);
      expect(JSON.parse(failedBody)).toEqual({
        ok: true,
        message:
          "If an account exists for that email, reset instructions will be sent shortly.",
      });

      const createdTokenHash = create.mock.calls[0][0].data.tokenHash;
      expect(deleteMany).toHaveBeenLastCalledWith({
        where: { tokenHash: createdTokenHash },
      });
      expect(errorLog).toHaveBeenCalledWith(
        "Password reset email delivery failed.",
      );
      if (failure === "cleanup") {
        expect(errorLog).toHaveBeenCalledWith(
          "Failed to remove undelivered password reset token.",
        );
      }
      expect(securityEventCreate).toHaveBeenCalledWith({
        data: {
          type: "PASSWORD_RESET_REQUEST",
          outcome: "FAILURE",
          userId: null,
          ipAddress: null,
          userAgent: null,
          metadata: undefined,
        },
      });
      expect(securityEventCreate).not.toHaveBeenCalledWith({
        data: expect.objectContaining({ outcome: "SUCCESS" }),
      });
    },
  );
});
