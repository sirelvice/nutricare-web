import { describe, expect, it, vi } from "vitest";
import { GetRecommendationsService } from "@/lib/reco/service";
import type { ProfileRepository } from "@/lib/profile/repositories/profile-repository";
import type { WeightRepository } from "@/lib/tracking/repositories/weight-repository";
import type { NutritionPlanRepository } from "@/lib/nutrition-plan/repository";

function createService() {
  const profileRepository: ProfileRepository = {
    findByUserId: vi.fn(),
    save: vi.fn(),
  };

  const weightRepository: WeightRepository = {
    create: vi.fn(),
    findByUserId: vi.fn(),
    findLatestByUserId: vi.fn(),
    delete: vi.fn(),
  };

  const nutritionPlanRepository: NutritionPlanRepository = {
    create: vi.fn(),
    findLatestByUserId: vi.fn(),
    findAllByUserId: vi.fn(),
  };

  return {
    service: new GetRecommendationsService(
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
    ),
    profileRepository,
    weightRepository,
    nutritionPlanRepository,
  };
}

describe("GetRecommendationsService", () => {
  it("builds recommendations from the authenticated user's profile, weight, and plan", async () => {
    const {
      service,
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
    } = createService();

    vi.mocked(profileRepository.findByUserId).mockResolvedValue({
      heightCm: 170,
      gender: "male",
      age: 30,
      activity: "moderate",
      goal: "maintain",
    });

    vi.mocked(weightRepository.findLatestByUserId).mockResolvedValue({
      id: "weight-1",
      date: "2026-09-03",
      weightKg: 60,
      note: "",
    });

    vi.mocked(nutritionPlanRepository.findLatestByUserId).mockResolvedValue({
      id: "plan-1",
      version: 1,
      goal: "maintain",
      targetCalories: 2353,
      proteinG: 147,
      carbsG: 294,
      fatG: 65,
      createdAt: "2026-09-03T00:00:00.000Z",
    });

    const result = await service.execute("user-1");

    expect(result).not.toBeNull();
    expect(result?.context).toEqual({
      plan: { id: "plan-1", version: 1, goal: "maintain", createdAt: "2026-09-03T00:00:00.000Z" },
      measurement: { date: "2026-09-03", weightKg: 60 },
    });
    expect(result?.bmi).toBe(20.8);
    expect(result?.category.label).toBe("Normal");
    expect(result?.targetCalories).toBe(2353);
    expect(result?.macros).toEqual({
      proteinG: 147,
      carbsG: 294,
      fatG: 65,
    });
    expect(result?.recommendations).toBeDefined();

    expect(profileRepository.findByUserId).toHaveBeenCalledWith("user-1");
    expect(weightRepository.findLatestByUserId).toHaveBeenCalledWith("user-1");
    expect(
      nutritionPlanRepository.findLatestByUserId,
    ).toHaveBeenCalledWith("user-1");
  });

  it("returns null when the profile is missing", async () => {
    const { service, profileRepository } = createService();

    vi.mocked(profileRepository.findByUserId).mockResolvedValue(null);

    await expect(service.execute("user-1")).resolves.toBeNull();
  });

  it("returns null when the latest weight is missing", async () => {
    const { service, profileRepository, weightRepository } = createService();

    vi.mocked(profileRepository.findByUserId).mockResolvedValue({
      heightCm: 170,
      gender: "male",
      age: 30,
      activity: "moderate",
      goal: "maintain",
    });

    vi.mocked(weightRepository.findLatestByUserId).mockResolvedValue(null);

    await expect(service.execute("user-1")).resolves.toBeNull();
  });

  it("returns null when the nutrition plan is missing", async () => {
    const {
      service,
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
    } = createService();

    vi.mocked(profileRepository.findByUserId).mockResolvedValue({
      heightCm: 170,
      gender: "male",
      age: 30,
      activity: "moderate",
      goal: "maintain",
    });

    vi.mocked(weightRepository.findLatestByUserId).mockResolvedValue({
      id: "weight-1",
      date: "2026-09-03",
      weightKg: 60,
      note: "",
    });

    vi.mocked(nutritionPlanRepository.findLatestByUserId).mockResolvedValue(null);

    await expect(service.execute("user-1")).resolves.toBeNull();
  });

  it("requires a user ID", async () => {
    const { service } = createService();

    await expect(service.execute("")).rejects.toThrow("User ID is required");
  });
});


describe("recommendation age eligibility", () => {
  it.each([
    [null, "RECOMMENDATIONS_AGE_REQUIRED"],
    [NaN, "RECOMMENDATIONS_AGE_REQUIRED"],
    [19.5, "RECOMMENDATIONS_AGE_REQUIRED"],
    [121, "RECOMMENDATIONS_AGE_REQUIRED"],
    [10, "RECOMMENDATIONS_AGE_UNSUPPORTED"],
    [18, "RECOMMENDATIONS_AGE_UNSUPPORTED"],
    [19, "RECOMMENDATIONS_AGE_UNSUPPORTED"],
  ] as const)("does not generate adult guidance for age %s", async (age, code) => {
    const { service, profileRepository, weightRepository, nutritionPlanRepository } = createService();
    vi.mocked(profileRepository.findByUserId).mockResolvedValue({
      heightCm: 170, age, gender: "male", activity: "moderate", goal: "maintain",
    });
    await expect(service.execute("user-1")).rejects.toMatchObject({ code });
    expect(weightRepository.findLatestByUserId).not.toHaveBeenCalled();
    expect(nutritionPlanRepository.findLatestByUserId).not.toHaveBeenCalled();
  });

  it("allows the product's age-20 boundary with complete data", async () => {
    const { service, profileRepository, weightRepository, nutritionPlanRepository } = createService();
    vi.mocked(profileRepository.findByUserId).mockResolvedValue({
      heightCm: 170, age: 20, gender: "male", activity: "moderate", goal: "maintain",
    });
    vi.mocked(weightRepository.findLatestByUserId).mockResolvedValue({
      id: "weight-1", date: "2026-10-07", weightKg: 60,
    });
    vi.mocked(nutritionPlanRepository.findLatestByUserId).mockResolvedValue({
      id: "plan-1", version: 1, goal: "maintain", targetCalories: 2353,
      proteinG: 147, carbsG: 294, fatG: 65, createdAt: "2026-10-07T00:00:00.000Z",
    });
    const result = await service.execute("user-1");
    expect(result?.bmi).toBe(20.8);
    expect(result?.recommendations.contentVersion).toBe("2026-10-07.1");
  });
});


describe("recommendation plan consistency", () => {
  it("does not produce guidance for a plan that disagrees with the profile goal", async () => {
    const { service, profileRepository, weightRepository, nutritionPlanRepository } = createService();
    vi.mocked(profileRepository.findByUserId).mockResolvedValue({
      heightCm: 170, age: 30, gender: "male", activity: "moderate", goal: "lose",
    });
    vi.mocked(weightRepository.findLatestByUserId).mockResolvedValue({ id: "weight-1", date: "2026-10-07", weightKg: 60 });
    vi.mocked(nutritionPlanRepository.findLatestByUserId).mockResolvedValue({
      id: "plan-1", version: 1, goal: "gain", targetCalories: 2353, proteinG: 147,
      carbsG: 294, fatG: 65, createdAt: "2026-10-07T00:00:00.000Z",
    });
    await expect(service.execute("user-1")).rejects.toMatchObject({ code: "RECOMMENDATIONS_PLAN_REVIEW_REQUIRED" });
  });
});
