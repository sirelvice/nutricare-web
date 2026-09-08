import { beforeEach, describe, expect, it, vi } from "vitest";

const { create, fetchMock } = vi.hoisted(() => ({
  create: vi.fn(),
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

import { POST } from "./route";

describe("POST /api/contact", () => {
  beforeEach(() => {
    create.mockReset();
    fetchMock.mockReset();

    delete process.env.RESEND_API_KEY;
    delete process.env.CONTACT_TO_EMAIL;
    delete process.env.CONTACT_FROM_EMAIL;
  });

  it("returns 400 when required fields are missing", async () => {
    const request = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      error: "Name, email and message are required.",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid email", async () => {
    const request = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      error: "Enter a valid email.",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("persists a valid contact message", async () => {
    create.mockResolvedValue({ id: "contact-1" });

    const request = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
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
});
