import { describe, expect, it, vi } from "vitest";

const { mockAuth, mockExecute } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockExecute: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/reco/service", () => ({
  GetRecommendationsService: class {
    execute = mockExecute;
  },
}));

import { GET } from "./route";

describe("GET /api/recommendations", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns recommendations for the authenticated user", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1" },
    });

    mockExecute.mockResolvedValue({
      bmi: 20.8,
      category: {
        label: "Normal",
        note: "Within the healthy range.",
      },
      targetCalories: 2353,
      recommendations: {
        summary: "Healthy range",
      },
    });

    const response = await GET();

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.bmi).toBe(20.8);
    expect(body.category.label).toBe("Normal");
    expect(body.targetCalories).toBe(2353);
    expect(body.recommendations).toBeDefined();

    expect(mockExecute).toHaveBeenCalledWith("user-1");
  });

  it("returns 422 when required user data is unavailable", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1" },
    });

    mockExecute.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(422);
  });

  it("returns 500 when the service fails", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1" },
    });

    mockExecute.mockRejectedValue(new Error("Database failure"));

    const response = await GET();

    expect(response.status).toBe(500);
  });
});
