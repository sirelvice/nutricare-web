import { describe, expect, it, vi } from "vitest";
import { EvaluateProgressService } from "./service";
import type { UserProfile } from "@/lib/profile/domain";
import type { WeightEntry } from "@/lib/tracking/domain";
import type { ProfileRepository } from "@/lib/profile/repositories/profile-repository";
import type { WeightRepository } from "@/lib/tracking/repositories/weight-repository";
import type { NutritionPlanRepository } from "@/lib/nutrition-plan/repository";

const profile = (goal: UserProfile["goal"]): UserProfile => ({
  heightCm: 176,
  gender: "male",
  age: 24,
  activity: "moderate",
  goal,
});

const entry = (id: string, date: string, weightKg: number): WeightEntry => ({
  id,
  date,
  weightKg,
});

const plan = (createdAt: string, goal: UserProfile["goal"] = "lose") => ({
  id: "plan-1",
  version: 1,
  goal,
  targetCalories: 2000,
  proteinG: 150,
  carbsG: 225,
  fatG: 56,
  createdAt,
});

describe("EvaluateProgressService", () => {
  it("rejects a missing user ID", async () => {
    const service = new EvaluateProgressService(
      {} as ProfileRepository,
      {} as WeightRepository,
      {} as NutritionPlanRepository,
    );

    await expect(service.execute("")).rejects.toThrow("User ID is required");
  });

  it("returns null when the profile does not exist", async () => {
    const profileRepository = {
      findByUserId: vi.fn().mockResolvedValue(null),
    } as unknown as ProfileRepository;

    const weightRepository = {
      findByUserId: vi.fn(),
    } as unknown as WeightRepository;

    const nutritionPlanRepository = {
      findLatestByUserId: vi.fn(),
    } as unknown as NutritionPlanRepository;

    const service = new EvaluateProgressService(
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
    );

    await expect(service.execute("user-1")).resolves.toBeNull();

    expect(profileRepository.findByUserId).toHaveBeenCalledWith("user-1");
    expect(weightRepository.findByUserId).not.toHaveBeenCalled();
    expect(nutritionPlanRepository.findLatestByUserId).not.toHaveBeenCalled();
  });

  it("evaluates progress using only weights from the current plan period", async () => {
    const profileRepository = {
      findByUserId: vi.fn().mockResolvedValue(profile("lose")),
    } as unknown as ProfileRepository;

    const weightRepository = {
      findByUserId: vi.fn().mockResolvedValue([
        entry("old-3", "2026-07-15", 75),
        entry("old-2", "2026-07-22", 74.8),
        entry("old-1", "2026-07-29", 74.5),
        entry("new-3", "2026-08-15", 70.4),
        entry("new-1", "2026-08-01", 71),
        entry("new-2", "2026-08-08", 70.7),
      ]),
    } as unknown as WeightRepository;

    const nutritionPlanRepository = {
      findLatestByUserId: vi.fn().mockResolvedValue(
        plan("2026-08-01T12:00:00.000Z", "lose"),
      ),
    } as unknown as NutritionPlanRepository;

    const service = new EvaluateProgressService(
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
    );

    await expect(service.execute("user-1")).resolves.toEqual({
      state: "ON_TRACK",
      changeKg: -0.6,
      entriesCount: 3,
      evaluationDays: 14,
    });

    expect(nutritionPlanRepository.findLatestByUserId).toHaveBeenCalledWith(
      "user-1",
    );
  });

  it("includes an entry recorded on the plan creation date", async () => {
    const profileRepository = {
      findByUserId: vi.fn().mockResolvedValue(profile("lose")),
    } as unknown as ProfileRepository;

    const weightRepository = {
      findByUserId: vi.fn().mockResolvedValue([
        entry("1", "2026-08-01", 70),
        entry("2", "2026-08-08", 69.7),
        entry("3", "2026-08-15", 69.4),
      ]),
    } as unknown as WeightRepository;

    const nutritionPlanRepository = {
      findLatestByUserId: vi.fn().mockResolvedValue(
        plan("2026-08-01T23:30:00.000Z", "lose"),
      ),
    } as unknown as NutritionPlanRepository;

    const service = new EvaluateProgressService(
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
    );

    await expect(service.execute("user-1")).resolves.toEqual({
      state: "ON_TRACK",
      changeKg: -0.6,
      entriesCount: 3,
      evaluationDays: 14,
    });
  });

  it("uses the current plan goal with the filtered history", async () => {
    const profileRepository = {
      findByUserId: vi.fn().mockResolvedValue(profile("gain")),
    } as unknown as ProfileRepository;

    const weightRepository = {
      findByUserId: vi.fn().mockResolvedValue([
        entry("old-1", "2026-07-20", 62),
        entry("old-2", "2026-07-27", 61.5),
        entry("1", "2026-08-01", 60),
        entry("2", "2026-08-08", 60.3),
        entry("3", "2026-08-15", 60.6),
      ]),
    } as unknown as WeightRepository;

    const nutritionPlanRepository = {
      findLatestByUserId: vi.fn().mockResolvedValue(
        plan("2026-08-01T00:00:00.000Z", "gain"),
      ),
    } as unknown as NutritionPlanRepository;

    const service = new EvaluateProgressService(
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
    );

    await expect(service.execute("user-1")).resolves.toEqual({
      state: "ON_TRACK",
      changeKg: 0.6,
      entriesCount: 3,
      evaluationDays: 14,
    });
  });

  it("returns insufficient data when the new plan has too little history", async () => {
    const profileRepository = {
      findByUserId: vi.fn().mockResolvedValue(profile("lose")),
    } as unknown as ProfileRepository;

    const weightRepository = {
      findByUserId: vi.fn().mockResolvedValue([
        entry("old-1", "2026-07-20", 72),
        entry("old-2", "2026-07-27", 71.5),
        entry("new-1", "2026-08-10", 70),
        entry("new-2", "2026-08-12", 69.8),
      ]),
    } as unknown as WeightRepository;

    const nutritionPlanRepository = {
      findLatestByUserId: vi.fn().mockResolvedValue(
        plan("2026-08-01T00:00:00.000Z", "lose"),
      ),
    } as unknown as NutritionPlanRepository;

    const service = new EvaluateProgressService(
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
    );

    await expect(service.execute("user-1")).resolves.toEqual({
      state: "INSUFFICIENT_DATA",
      changeKg: null,
      entriesCount: 2,
      evaluationDays: null,
    });
  });

  it("rejects evaluation when no current nutrition plan exists", async () => {
    const profileRepository = {
      findByUserId: vi.fn().mockResolvedValue(profile("lose")),
    } as unknown as ProfileRepository;

    const weightRepository = {
      findByUserId: vi.fn().mockResolvedValue([
        entry("1", "2026-08-01", 70),
        entry("2", "2026-08-08", 69.7),
        entry("3", "2026-08-15", 69.4),
      ]),
    } as unknown as WeightRepository;

    const nutritionPlanRepository = {
      findLatestByUserId: vi.fn().mockResolvedValue(null),
    } as unknown as NutritionPlanRepository;

    const service = new EvaluateProgressService(
      profileRepository,
      weightRepository,
      nutritionPlanRepository,
    );

    await expect(service.execute("user-1")).rejects.toThrow(
      "Current nutrition plan is required",
    );
  });
});
