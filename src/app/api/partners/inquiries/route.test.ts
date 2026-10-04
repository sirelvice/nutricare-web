import { beforeEach, describe, expect, it, vi } from "vitest";

const { create } = vi.hoisted(() => ({
  create: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    partnerInquiry: {
      create,
    },
  },
}));

import { POST } from "./route";

describe("POST /api/partners/inquiries", () => {
  beforeEach(() => {
    create.mockReset();
  });

  it("returns 400 for invalid input", async () => {
    const request = new Request("http://localhost/api/partners/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
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
});
