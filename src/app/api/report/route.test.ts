import { describe, expect, it, vi } from "vitest";

const { mockAuth, mockExecute } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockExecute: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/report/service", () => ({
  GetReportService: class {
    execute = mockExecute;
  },
}));

vi.mock("@/lib/profile/repositories/prisma-profile-repository", () => ({
  PrismaProfileRepository: class {},
}));

vi.mock("@/lib/tracking/repositories/prisma-weight-repository", () => ({
  PrismaWeightRepository: class {},
}));

vi.mock("@/lib/nutrition-plan/prisma-repository", () => ({
  prismaNutritionPlanRepository: {},
}));

import { GET } from "@/app/api/report/route";

describe("GET /api/report", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Authentication required.",
    });
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("returns the report for an authenticated user", async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });

    mockExecute.mockResolvedValue({
      generatedAt: "2026-09-03T00:00:00.000Z",
      profile: {
        heightCm: 176,
        gender: "male",
        age: 24,
        activity: "moderate",
        goal: "gain",
      },
      bmi: {
        latest: {
          value: 20,
          category: {
            label: "Normal",
            note: "Within the healthy range.",
          },
        },
      },
      nutritionPlan: {
        id: "plan-1",
        version: 1,
        goal: "gain",
        targetCalories: 2500,
        proteinG: 156,
        carbsG: 313,
        fatG: 69,
        createdAt: "2026-09-03T00:00:00.000Z",
      },
      weight: {
        stats: null,
        entriesCount: 0,
        entries: [],
      },
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        profile: expect.objectContaining({
          goal: "gain",
        }),
        nutritionPlan: expect.objectContaining({
          version: 1,
        }),
      }),
    );
    expect(mockExecute).toHaveBeenCalledWith("user-1");
  });

  it("returns 404 when the report has no profile", async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });

    mockExecute.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Profile not found",
    });
  });

  it("returns 500 when report generation fails", async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });

    mockExecute.mockRejectedValue(new Error("Database failure"));

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Unable to generate report",
    });
  });
});
