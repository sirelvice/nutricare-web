import { beforeEach, describe, expect, it, vi } from "vitest";

const { create, consume } = vi.hoisted(() => ({
  create: vi.fn(),
  consume: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    partnerInquiry: {
      create,
    },
  },
}));

vi.mock("@/lib/security/runtime-config", () => ({ getAppUrl: () => "http://localhost" }));
vi.mock("@/lib/security/rate-limit", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/security/rate-limit")>(),
  consumeRateLimit: consume,
}));

import { POST } from "./route";

describe("POST /api/partners/inquiries", () => {
  beforeEach(() => {
    create.mockReset();
    consume.mockReset();
    consume.mockResolvedValue({ allowed: true, remaining: 4, retryAfterSeconds: 900 });
  });

  it("returns 400 for invalid input", async () => {
    const request = new Request("http://localhost/api/partners/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify({
        orgName: "A",
        contactName: "",
        email: "not-an-email",
        interest: "pilot",
        message: "too short",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it("persists a valid inquiry and returns its id", async () => {
    create.mockResolvedValue({
      id: "inq_test_123",
    });

    const request = new Request("http://localhost/api/partners/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify({
        orgName: "Community Health Org",
        contactName: "Jane Doe",
        email: "Jane@Example.COM",
        country: "Kenya",
        interest: "pilot",
        message: "We would like to discuss a pilot programme.",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      ok: true,
      id: "inq_test_123",
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        orgName: "Community Health Org",
        contactName: "Jane Doe",
        email: "jane@example.com",
        country: "Kenya",
        interest: "PILOT",
        message: "We would like to discuss a pilot programme.",
      },
    });
  });

  it("returns 500 when persistence fails", async () => {
    create.mockRejectedValue(new Error("Database failure"));

    const request = new Request("http://localhost/api/partners/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify({
        orgName: "Community Health Org",
        contactName: "Jane Doe",
        email: "jane@example.com",
        interest: "research",
        message: "We would like to discuss a research collaboration.",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: "Unable to submit your inquiry right now.",
    });
  });

  const validDetails = { orgName: "Community Health Org", contactName: "Jane Doe", email: "jane@example.com", interest: "pilot", message: "We would like to discuss a pilot programme." };
  function submission(body: string, headers: Record<string, string> = {}) {
    return new Request("http://localhost/api/partners/inquiries", {
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
    expect(consume).toHaveBeenCalledWith(expect.objectContaining({ namespace: "public-partner-inquiry", limit: 5, windowSeconds: 900 }));
    expect(create).not.toHaveBeenCalled();
  });
  it("returns 400 for malformed JSON without saving", async () => {
    expect((await POST(submission("{broken"))).status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
  it.each([null, [], { orgName: 42 }, { orgName: "Community Health Org", contactName: "Jane Doe", email: "jane@example.com", interest: "pilot", message: "x".repeat(5001) }].map((value) => ({ value })))("rejects invalid runtime values: %j", async ({ value }) => {
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
