import { beforeEach, describe, expect, it, vi } from "vitest";

const historyExecute = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/nutrition-plan/service", () => ({
  GetNutritionPlanHistoryService: class {
    async execute(userId: string) {
      return historyExecute(userId);
    }
  },
}));

vi.mock("@/lib/nutrition-plan/prisma-repository", () => ({
  prismaNutritionPlanRepository: {},
}));

import { auth } from "@/auth";
import { GET } from "@/app/api/nutrition-plan/history/route";

describe("/api/nutrition-plan/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns plan history when authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123" },
    } as any);

    const plans = [
      {
        id: "plan-2",
        version: 2,
        goal: "maintain",
        targetCalories: 2200,
        proteinG: 138,
        carbsG: 275,
        fatG: 61,
        createdAt: "2026-09-03T00:00:00.000Z",
      },
      {
        id: "plan-1",
        version: 1,
        goal: "lose",
        targetCalories: 2000,
        proteinG: 150,
        carbsG: 225,
        fatG: 56,
        createdAt: "2026-09-02T00:00:00.000Z",
      },
    ];

    historyExecute.mockResolvedValue(plans);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ plans });
    expect(historyExecute).toHaveBeenCalledWith("user-123");
  });

  it("returns 500 when loading history fails", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123" },
    } as any);

    historyExecute.mockRejectedValue(new Error("Database failure"));

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Unable to load nutrition plan history",
    });
  });
});
