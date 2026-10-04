import { beforeEach, describe, expect, it, vi } from "vitest";

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

  it("fails closed when the application URL is not configured", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.CONTACT_FROM_EMAIL = "no-reply@nutricare.app";
    delete process.env.APP_URL;

    findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    });

    transaction.mockResolvedValue([]);

    const request = new Request("https://attacker.example/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(deleteMany).toHaveBeenCalledWith({
      where: { tokenHash: expect.any(String) },
    });
  });

  it("removes the token when email delivery fails", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.CONTACT_FROM_EMAIL = "no-reply@nutricare.app";

    findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    });

    transaction.mockResolvedValue([]);
    fetchMock.mockRejectedValue(new Error("Resend failure"));

    const request = new Request("https://nutricare.app/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(deleteMany).toHaveBeenCalledWith({
      where: { tokenHash: expect.any(String) },
    });
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
});
