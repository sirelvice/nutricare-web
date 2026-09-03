import { describe, expect, it, vi } from "vitest";
import { GetReportService } from "@/lib/report/service";
import type { ProfileRepository } from "@/lib/profile/repositories/profile-repository";
import type { WeightRepository } from "@/lib/tracking/repositories/weight-repository";
import type { NutritionPlanRepository } from "@/lib/nutrition-plan/repository";

function createRepositories() {
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
    profileRepository,
    weightRepository,
    nutritionPlanRepository,
  };
}

describe("GetReportService", () => {
  it("assembles persisted profile, weight, BMI, and nutrition plan data", async () => {
    const {
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
    } = createRepositories();

    vi.mocked(profileRepository.findByUserId).mockResolvedValue({
      heightCm: 176,
      gender: "male",
      age: 24,
      activity: "moderate",
      goal: "gain",
    });

    vi.mocked(weightRepository.findByUserId).mockResolvedValue([
      {
        id: "weight-2",
        date: "2026-09-03",
        weightKg: 62,
        note: "Latest",
      },
      {
        id: "weight-1",
        date: "2026-08-01",
        weightKg: 60,
      },
    ]);

    vi.mocked(nutritionPlanRepository.findLatestByUserId).mockResolvedValue({
      id: "plan-2",
      version: 2,
      goal: "gain",
      targetCalories: 2500,
      proteinG: 156,
      carbsG: 313,
      fatG: 69,
      createdAt: "2026-09-03T00:00:00.000Z",
    });

    const service = new GetReportService(
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
    );

    const result = await service.execute("user-1");

    expect(result).not.toBeNull();
    expect(result?.profile.goal).toBe("gain");
    expect(result?.bmi.latest?.value).toBe(20);
    expect(result?.bmi.latest?.category.label).toBe("Normal");
    expect(result?.nutritionPlan?.version).toBe(2);
    expect(result?.weight.entriesCount).toBe(2);
    expect(result?.weight.stats?.change).toBe(2);
  });

  it("returns a report without BMI when height is unavailable", async () => {
    const {
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
    } = createRepositories();

    vi.mocked(profileRepository.findByUserId).mockResolvedValue({
      heightCm: null,
      gender: "male",
      age: 24,
      activity: "moderate",
      goal: "maintain",
    });

    vi.mocked(weightRepository.findByUserId).mockResolvedValue([
      {
        id: "weight-1",
        date: "2026-09-03",
        weightKg: 60,
      },
    ]);

    vi.mocked(nutritionPlanRepository.findLatestByUserId).mockResolvedValue(
      null,
    );

    const service = new GetReportService(
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
    );

    const result = await service.execute("user-1");

    expect(result?.bmi.latest).toBeNull();
    expect(result?.nutritionPlan).toBeNull();
    expect(result?.weight.entriesCount).toBe(1);
  });

  it("returns null when the user has no profile", async () => {
    const {
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
    } = createRepositories();

    vi.mocked(profileRepository.findByUserId).mockResolvedValue(null);
    vi.mocked(weightRepository.findByUserId).mockResolvedValue([]);
    vi.mocked(nutritionPlanRepository.findLatestByUserId).mockResolvedValue(
      null,
    );

    const service = new GetReportService(
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
    );

    await expect(service.execute("user-1")).resolves.toBeNull();
  });

  it("rejects a missing user id", async () => {
    const {
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
    } = createRepositories();

    const service = new GetReportService(
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
    );

    await expect(service.execute("")).rejects.toThrow("User ID is required");
  });
});
