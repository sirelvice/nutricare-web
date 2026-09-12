import { describe, expect, it, vi } from "vitest";
import { GetReportService } from "@/lib/report/service";
import { GetCurrentProgressService } from "@/lib/progress/get-current-progress-service";
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

  const currentProgressService = {
    execute: vi.fn(),
  } as unknown as GetCurrentProgressService;

  return {
    profileRepository,
    weightRepository,
    nutritionPlanRepository,
    currentProgressService,
  };
}

describe("GetReportService", () => {
  it("assembles persisted profile, weight, BMI, and nutrition plan data", async () => {
    const {
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
      currentProgressService,
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

    vi.mocked(currentProgressService.execute).mockResolvedValue({
      planVersionId: "plan-2",
      evaluation: {
        id: "evaluation-1",
        state: "ON_TRACK",
        changeKg: 2,
        entriesCount: 2,
        evaluationDays: 33,
        evaluatedAt: "2026-09-03T00:00:00.000Z",
        headline: "You're moving toward your goal",
        summary: "Your logged weight increased by 2.0 kg over 33 days.",
      },
      recommendation: {
        recommendedAction: "CONTINUE",
        reason: "on_track",
        adjustmentDecision: "PENDING",
        respondedAt: null,
        message: "Your recent results are consistent with your current goal.",
      },
    });

    const service = new GetReportService(
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
      currentProgressService,
    );

    const result = await service.execute("user-1");

    expect(result).not.toBeNull();
    expect(result?.profile.goal).toBe("gain");
    expect(result?.bmi.latest?.value).toBe(20);
    expect(result?.bmi.latest?.category.label).toBe("Normal");
    expect(result?.nutritionPlan?.version).toBe(2);
    expect(result?.weight.entriesCount).toBe(2);
    expect(result?.weight.stats?.change).toBe(2);
    expect(result?.progress?.evaluation?.headline).toBe(
      "You're moving toward your goal",
    );
    expect(result?.progress?.evaluation?.summary).toBe(
      "Your logged weight increased by 2.0 kg over 33 days.",
    );
    expect(result?.progress?.recommendation?.recommendedAction).toBe("CONTINUE");
  });

  it("returns a report without BMI when height is unavailable", async () => {
    const {
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
      currentProgressService,
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
      currentProgressService,
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
      currentProgressService,
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
      currentProgressService,
    );

    await expect(service.execute("user-1")).resolves.toBeNull();
  });

  it("rejects a missing user id", async () => {
    const {
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
      currentProgressService,
    } = createRepositories();

    const service = new GetReportService(
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
      currentProgressService,
    );

    await expect(service.execute("")).rejects.toThrow("User ID is required");
  });
});
