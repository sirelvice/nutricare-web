import { beforeEach, describe, expect, it, vi } from "vitest";

const { create, fetchMock, consume } = vi.hoisted(() => ({
  create: vi.fn(),
  consume: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    contactMessage: {
      create,
    },
  },
}));

vi.stubGlobal("fetch", fetchMock);

vi.mock("@/lib/security/runtime-config", () => ({ getAppUrl: () => "http://localhost" }));
vi.mock("@/lib/security/rate-limit", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/security/rate-limit")>(),
  consumeRateLimit: consume,
}));

import { POST } from "./route";

describe("POST /api/contact", () => {
  beforeEach(() => {
    create.mockReset();
    consume.mockReset();
    consume.mockResolvedValue({ allowed: true, remaining: 4, retryAfterSeconds: 900 });
    fetchMock.mockReset();

    delete process.env.RESEND_API_KEY;
    delete process.env.CONTACT_TO_EMAIL;
    delete process.env.CONTACT_FROM_EMAIL;
  });

  it("returns 400 when required fields are missing", async () => {
    const request = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify({
        name: "",
        email: "",
        message: "",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Please provide valid contact details.",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid email", async () => {
    const request = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify({
        name: "Jane Doe",
        email: "not-an-email",
        message: "Hello NutriCare.",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Please provide valid contact details.",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("persists a valid contact message", async () => {
    create.mockResolvedValue({ id: "contact-1" });

    const request = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify({
        name: " Jane Doe ",
        email: "jane@example.com",
        phone: " 0712345678 ",
        message: " I would like to learn more about NutriCare. ",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      id: "contact-1",
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "0712345678",
        message: "I would like to learn more about NutriCare.",
      },
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("still succeeds when email delivery fails after persistence", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.CONTACT_TO_EMAIL = "contact@nutricare.app";
    process.env.CONTACT_FROM_EMAIL = "no-reply@nutricare.app";

    create.mockResolvedValue({ id: "contact-2" });
    fetchMock.mockRejectedValue(new Error("Resend failure"));

    const request = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify({
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "",
        message: "Please contact me about the product.",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      id: "contact-2",
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when persistence fails", async () => {
    create.mockRejectedValue(new Error("Database failure"));

    const request = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify({
        name: "Jane Doe",
        email: "jane@example.com",
        message: "Please contact me about the product.",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: "Server error.",
    });
  });

  const validDetails = { name: "Jane Doe", email: "jane@example.com", message: "Please contact me about the product." };
  function submission(body: string, headers: Record<string, string> = {}) {
    return new Request("http://localhost/api/contact", {
      method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost", ...headers }, body,
    });
  }
  it("rejects cross-origin and missing-origin writes before consuming a bucket", async () => {
    for (const origin of ["https://untrusted.example", ""]) {
      expect((await POST(submission(JSON.stringify(validDetails), { Origin: origin }))).status).toBe(403);
    }
    expect(consume).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
  it("rejects non-JSON requests", async () => {
    expect((await POST(submission(JSON.stringify(validDetails), { "Content-Type": "text/plain" }))).status).toBe(415);
    expect(create).not.toHaveBeenCalled();
  });
  it("returns 429 with retry headers without saving", async () => {
    consume.mockResolvedValue({ allowed: false, remaining: 0, retryAfterSeconds: 42 });
    const response = await POST(submission(JSON.stringify(validDetails)));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    expect(consume).toHaveBeenCalledWith(expect.objectContaining({ namespace: "public-contact", limit: 5, windowSeconds: 900 }));
    expect(create).not.toHaveBeenCalled();
  });
  it("returns 400 for malformed JSON without saving", async () => {
    expect((await POST(submission("{broken"))).status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
  it.each([null, [], { name: 42, email: "jane@example.com", message: "Hello" }, { name: "Jane", email: "jane@example.com", message: "x".repeat(5001) }, { name: "Jane", email: "jane@example.com", message: "Hello", phone: {} }].map((value) => ({ value })))("rejects invalid runtime values: %j", async ({ value }) => {
    expect((await POST(submission(JSON.stringify(value)))).status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
  it("bounds actual body bytes even when content-length understates the body", async () => {
    const response = await POST(submission(JSON.stringify({ ...validDetails, message: "界".repeat(12000) }), { "Content-Length": "1" }));
    expect(response.status).toBe(413);
    expect(create).not.toHaveBeenCalled();
  });
  it("rejects an oversized declared body before parsing", async () => {
    expect((await POST(submission(JSON.stringify(validDetails), { "Content-Length": "40000" }))).status).toBe(413);
    expect(create).not.toHaveBeenCalled();
  });
  it("does not save when the rate-limit store fails", async () => {
    consume.mockRejectedValue(new Error("Rate-limit store unavailable"));
    expect((await POST(submission(JSON.stringify(validDetails)))).status).toBe(500);
    expect(create).not.toHaveBeenCalled();
  });
});
