import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, deleteMany, create, transaction, fetchMock } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  deleteMany: vi.fn(),
  create: vi.fn(),
  transaction: vi.fn(),
  fetchMock: vi.fn(),
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
  },
}));

vi.stubGlobal("fetch", fetchMock);

import { POST } from "./route";

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    findUnique.mockReset();
    deleteMany.mockReset();
    create.mockReset();
    transaction.mockReset();
    fetchMock.mockReset();

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
  });

  it("creates a reset token and sends the reset email", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.CONTACT_FROM_EMAIL = "no-reply@nutricare.app";

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

    const request = new Request("https://nutricare.app/api/auth/forgot-password", {
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
    expect(emailBody.html).toContain("/reset-password?token=");
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
  });
});
