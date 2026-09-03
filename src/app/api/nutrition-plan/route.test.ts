import { beforeEach, describe, expect, it, vi } from "vitest";

const generateExecute = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/nutrition-plan/service", () => ({
  GetLatestNutritionPlanService: class {
    async execute() {
      return undefined;
    }
  },
}));

vi.mock("@/lib/nutrition-plan/generate-service", () => ({
  GenerateNutritionPlanService: class {
    async execute(userId: string) {
      return generateExecute(userId);
    }
  },
}));

vi.mock("@/lib/nutrition-plan/prisma-repository", () => ({
  prismaNutritionPlanRepository: {},
}));

vi.mock("@/lib/profile/repositories/prisma-profile-repository", () => ({
  PrismaProfileRepository: class {},
}));

vi.mock("@/lib/tracking/repositories/prisma-weight-repository", () => ({
  PrismaWeightRepository: class {},
}));

vi.mock("@/lib/db", () => ({
  prisma: {},
}));

import { auth } from "@/auth";
import { GET, POST } from "@/app/api/nutrition-plan/route";

describe("/api/nutrition-plan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("GET returns 200 when authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123" },
    } as any);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      plan: undefined,
    });
  });

  it("POST returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const response = await POST();

    expect(response.status).toBe(401);
  });

  it("POST returns 422 when profile or current weight is missing", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123" },
    } as any);

    generateExecute.mockResolvedValue(null);

    const response = await POST();

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      error:
        "Profile and current weight are required to generate a nutrition plan",
    });
    expect(generateExecute).toHaveBeenCalledWith("user-123");
  });

  it("POST returns 201 with the generated plan", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123" },
    } as any);

    const plan = {
      id: "plan-1",
      version: 1,
      goal: "lose",
      targetCalories: 2053,
      proteinG: 154,
      carbsG: 231,
      fatG: 57,
      createdAt: "2026-09-03T00:00:00.000Z",
    };

    generateExecute.mockResolvedValue(plan);

    const response = await POST();

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ plan });
    expect(generateExecute).toHaveBeenCalledWith("user-123");
  });
});
