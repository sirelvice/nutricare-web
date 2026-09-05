import { describe, expect, it, vi } from "vitest";
import type { NutritionPlanRepository } from "@/lib/nutrition-plan/repository";
import type { ProfileRepository } from "@/lib/profile/repositories/profile-repository";
import type { WeightRepository } from "@/lib/tracking/repositories/weight-repository";
import type {
  PersistedProgressEvaluation,
  ProgressEvaluationRepository,
} from "./repositories/progress-evaluation-repository";
import { EvaluateAndRecordProgressService } from "./evaluate-and-record-service";

const profileRepository = (goal: "lose" | "maintain" | "gain") =>
  ({
    findByUserId: vi.fn().mockResolvedValue({
      heightCm: 176,
      gender: "male",
      age: 24,
      activity: "moderate",
      goal,
    }),
  }) as unknown as ProfileRepository;

const weightRepository = (entries: Array<{
  id: string;
  date: string;
  weightKg: number;
}>) =>
  ({
    findByUserId: vi.fn().mockResolvedValue(entries),
  }) as unknown as WeightRepository;

const nutritionPlanRepository = (goal: "lose" | "maintain" | "gain") =>
  ({
    findLatestByUserId: vi.fn().mockResolvedValue({
      id: "plan-1",
      version: 1,
      goal,
      targetCalories: 2000,
      proteinG: 150,
      carbsG: 225,
      fatG: 56,
      createdAt: "2026-08-01T00:00:00.000Z",
    }),
  }) as unknown as NutritionPlanRepository;

const evaluationRepository = (
  history: PersistedProgressEvaluation[] = [],
) =>
  ({
    findByUserId: vi.fn().mockResolvedValue(history),
    create: vi.fn().mockImplementation(
      async (
        userId: string,
        evaluation: Omit<PersistedProgressEvaluation, "id" | "userId" | "evaluatedAt"> & {
          evaluatedAt?: string;
        },
      ) => ({
        id: "evaluation-1",
        userId,
        ...evaluation,
        evaluatedAt:
          evaluation.evaluatedAt ?? "2026-09-15T12:00:00.000Z",
      }),
    ),
  }) as unknown as ProgressEvaluationRepository;

const weights = [
  { id: "1", date: "2026-08-01", weightKg: 70 },
  { id: "2", date: "2026-08-08", weightKg: 69.8 },
  { id: "3", date: "2026-08-15", weightKg: 69.4 },
];

describe("EvaluateAndRecordProgressService", () => {
  it("rejects a missing user ID", async () => {
    const service = new EvaluateAndRecordProgressService(
      profileRepository("lose"),
      weightRepository([]),
      nutritionPlanRepository("lose"),
      evaluationRepository(),
    );

    await expect(service.execute("")).rejects.toThrow("User ID is required");
  });

  it("returns null when the profile does not exist", async () => {
    const profileRepo = {
      findByUserId: vi.fn().mockResolvedValue(null),
    } as unknown as ProfileRepository;

    const service = new EvaluateAndRecordProgressService(
      profileRepo,
      weightRepository(weights),
      nutritionPlanRepository("lose"),
      evaluationRepository(),
    );

    await expect(service.execute("user-1")).resolves.toBeNull();
  });

  it("evaluates using the current plan goal and persists the evaluation", async () => {
    const evaluations = evaluationRepository();

    const service = new EvaluateAndRecordProgressService(
      profileRepository("gain"),
      weightRepository([
        { id: "1", date: "2026-08-01", weightKg: 60 },
        { id: "2", date: "2026-08-08", weightKg: 60.3 },
        { id: "3", date: "2026-08-15", weightKg: 60.6 },
      ]),
      nutritionPlanRepository("gain"),
      evaluations,
    );

    const result = await service.execute("user-1");

    expect(result).toMatchObject({
      evaluation: {
        state: "ON_TRACK",
        changeKg: 0.6,
        entriesCount: 3,
        evaluationDays: 14,
      },
      recommendation: {
        recommendedAction: "CONTINUE",
        reason: "on_track",
      },
      persistedEvaluation: {
        planVersionId: "plan-1",
        state: "ON_TRACK",
        changeKg: 0.6,
        entriesCount: 3,
        evaluationDays: 14,
        recommendedAction: "CONTINUE",
        recommendationReason: "on_track",
      },
    });

    expect(evaluations.create).toHaveBeenCalledWith("user-1", {
      planVersionId: "plan-1",
      state: "ON_TRACK",
      changeKg: 0.6,
      entriesCount: 3,
      evaluationDays: 14,
      recommendedAction: "CONTINUE",
      recommendationReason: "on_track",
    });
  });

  it("uses persisted evaluation history for consecutive-problem recommendations", async () => {
    const evaluations = evaluationRepository([
      {
        id: "previous",
        userId: "user-1",
        planVersionId: "plan-1",
        state: "PLATEAU",
        changeKg: 0.2,
        entriesCount: 3,
        evaluationDays: 14,
        recommendedAction: "REVIEW_ADHERENCE",
        recommendationReason: "first_problem",
        evaluatedAt: "2026-09-15T12:00:00.000Z",
      },
    ]);

    const service = new EvaluateAndRecordProgressService(
      profileRepository("lose"),
      weightRepository([
        { id: "1", date: "2026-08-01", weightKg: 70 },
        { id: "2", date: "2026-08-08", weightKg: 69.9 },
        { id: "3", date: "2026-08-15", weightKg: 69.8 },
      ]),
      nutritionPlanRepository("lose"),
      evaluations,
    );

    const result = await service.execute("user-1");

    expect(result?.evaluation.state).toBe("PLATEAU");
    expect(result?.recommendation).toEqual({
      recommendedAction: "CONSIDER_ADJUSTMENT",
      reason: "consecutive_problem",
    });
  });

  it("rejects evaluation when no current nutrition plan exists", async () => {
    const planRepository = {
      findLatestByUserId: vi.fn().mockResolvedValue(null),
    } as unknown as NutritionPlanRepository;

    const service = new EvaluateAndRecordProgressService(
      profileRepository("lose"),
      weightRepository(weights),
      planRepository,
      evaluationRepository(),
    );

    await expect(service.execute("user-1")).rejects.toThrow(
      "Current nutrition plan is required",
    );
  });
});
