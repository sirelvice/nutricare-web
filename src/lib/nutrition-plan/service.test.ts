import { describe, expect, it, vi } from "vitest";
import {
  CreateNutritionPlanService,
  GetLatestNutritionPlanService,
} from "@/lib/nutrition-plan/service";
import type { NutritionPlanRepository } from "@/lib/nutrition-plan/repository";

function createRepository(): NutritionPlanRepository {
  return {
    create: vi.fn(),
    findLatestByUserId: vi.fn(),
    findAllByUserId: vi.fn(),
  };
}

describe("CreateNutritionPlanService", () => {
  it("creates the first plan as version 1", async () => {
    const repository = createRepository();

    vi.mocked(repository.findLatestByUserId).mockResolvedValue(null);
    vi.mocked(repository.create).mockImplementation(async (_userId, plan) => ({
      id: "plan-1",
      ...plan,
      createdAt: "2026-09-03T00:00:00.000Z",
    }));

    const service = new CreateNutritionPlanService(repository);

    const result = await service.execute("user-1", {
      goal: "lose",
      targetCalories: 2000,
      proteinG: 150,
      carbsG: 225,
      fatG: 56,
    });

    expect(result.version).toBe(1);
    expect(repository.create).toHaveBeenCalledWith("user-1", {
      version: 1,
      goal: "lose",
      targetCalories: 2000,
      proteinG: 150,
      carbsG: 225,
      fatG: 56,
    });
  });

  it("increments the version from the latest plan", async () => {
    const repository = createRepository();

    vi.mocked(repository.findLatestByUserId).mockResolvedValue({
      id: "plan-1",
      version: 3,
      goal: "lose",
      targetCalories: 2000,
      proteinG: 150,
      carbsG: 225,
      fatG: 56,
      createdAt: "2026-09-03T00:00:00.000Z",
    });

    vi.mocked(repository.create).mockImplementation(async (_userId, plan) => ({
      id: "plan-4",
      ...plan,
      createdAt: "2026-09-03T00:00:00.000Z",
    }));

    const service = new CreateNutritionPlanService(repository);

    const result = await service.execute("user-1", {
      goal: "maintain",
      targetCalories: 2200,
      proteinG: 138,
      carbsG: 275,
      fatG: 61,
    });

    expect(result.version).toBe(4);
  });

  it("rejects a missing user id", async () => {
    const repository = createRepository();
    const service = new CreateNutritionPlanService(repository);

    await expect(
      service.execute("", {
        goal: "lose",
        targetCalories: 2000,
        proteinG: 150,
        carbsG: 225,
        fatG: 56,
      })
    ).rejects.toThrow("User ID is required");
  });
});

describe("GetLatestNutritionPlanService", () => {
  it("returns the latest plan", async () => {
    const repository = createRepository();

    vi.mocked(repository.findLatestByUserId).mockResolvedValue({
      id: "plan-2",
      version: 2,
      goal: "maintain",
      targetCalories: 2200,
      proteinG: 138,
      carbsG: 275,
      fatG: 61,
      createdAt: "2026-09-03T00:00:00.000Z",
    });

    const service = new GetLatestNutritionPlanService(repository);

    const result = await service.execute("user-1");

    expect(result?.version).toBe(2);
  });
});
