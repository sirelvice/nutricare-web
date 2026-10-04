import { describe, expect, it, vi } from "vitest";
import { GenerateNutritionPlanService } from "./generate-service";

const profile = {
  heightCm: 170,
  gender: "male" as const,
  age: 30,
  activity: "moderate" as const,
  goal: "lose" as const,
};

const weight = {
  id: "weight-1",
  date: "2026-09-03",
  weightKg: 60,
};

describe("GenerateNutritionPlanService", () => {
  it("generates and persists a plan from the user's profile and latest weight", async () => {
    const profileRepository = {
      findByUserId: vi.fn().mockResolvedValue(profile),
      save: vi.fn(),
    };

    const weightRepository = {
      create: vi.fn(),
      findByUserId: vi.fn(),
      findLatestByUserId: vi.fn().mockResolvedValue(weight),
      delete: vi.fn(),
    };

    const nutritionPlanRepository = {
      findLatestByUserId: vi.fn().mockResolvedValue(null),
      findAllByUserId: vi.fn(),
      create: vi.fn().mockImplementation(async (_userId, plan) => ({
        id: "plan-1",
        ...plan,
        createdAt: "2026-09-03T00:00:00.000Z",
      })),
    };

    const service = new GenerateNutritionPlanService(
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
    );

    const result = await service.execute("user-1");

    expect(profileRepository.findByUserId).toHaveBeenCalledWith("user-1");
    expect(weightRepository.findLatestByUserId).toHaveBeenCalledWith("user-1");
    expect(nutritionPlanRepository.create).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        version: 1,
        goal: "lose",
        targetCalories: 2053,
        proteinG: 154,
        carbsG: 231,
        fatG: 57,
      }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        id: "plan-1",
        version: 1,
        goal: "lose",
        targetCalories: 2053,
        proteinG: 154,
        carbsG: 231,
        fatG: 57,
      }),
    );
  });

  it("returns null when the user has no profile", async () => {
    const profileRepository = {
      findByUserId: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    };

    const weightRepository = {
      create: vi.fn(),
      findByUserId: vi.fn(),
      findLatestByUserId: vi.fn(),
      delete: vi.fn(),
    };

    const nutritionPlanRepository = {
      findLatestByUserId: vi.fn(),
      findAllByUserId: vi.fn(),
      create: vi.fn(),
    };

    const service = new GenerateNutritionPlanService(
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
    );

    const result = await service.execute("user-1");

    expect(result).toBeNull();
    expect(weightRepository.findLatestByUserId).not.toHaveBeenCalled();
    expect(nutritionPlanRepository.create).not.toHaveBeenCalled();
  });

  it("returns null when the user has no weight entry", async () => {
    const profileRepository = {
      findByUserId: vi.fn().mockResolvedValue(profile),
      save: vi.fn(),
    };

    const weightRepository = {
      create: vi.fn(),
      findByUserId: vi.fn(),
      findLatestByUserId: vi.fn().mockResolvedValue(null),
      delete: vi.fn(),
    };

    const nutritionPlanRepository = {
      findLatestByUserId: vi.fn(),
      findAllByUserId: vi.fn(),
      create: vi.fn(),
    };

    const service = new GenerateNutritionPlanService(
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
    );

    const result = await service.execute("user-1");

    expect(result).toBeNull();
    expect(nutritionPlanRepository.create).not.toHaveBeenCalled();
  });

  it("rejects a missing user ID", async () => {
    const service = new GenerateNutritionPlanService(
      { findByUserId: vi.fn(), save: vi.fn() },
      {
        create: vi.fn(),
        findByUserId: vi.fn(),
        findLatestByUserId: vi.fn(),
        delete: vi.fn(),
      },
      {
        findLatestByUserId: vi.fn(),
        findAllByUserId: vi.fn(),
        create: vi.fn(),
      },
    );

    await expect(service.execute("")).rejects.toThrow("User ID is required");
  });
});
