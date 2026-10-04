import { describe, expect, it, vi } from "vitest";
import type { NutritionPlanRepository } from "@/lib/nutrition-plan/repository";
import type { ProgressEvaluationRepository } from "@/lib/progress/repositories/progress-evaluation-repository";
import { EvaluateAndRecordProgressService } from "@/lib/progress/evaluate-and-record-service";
import { RecordWeightEntryService } from "./record-weight-entry";
import {
  PROGRESS_EVALUATION_CADENCE_DAYS,
  RecordWeightAndEvaluateService,
} from "./record-weight-and-evaluate";

describe("RecordWeightAndEvaluateService", () => {
  const entry = {
    date: "2026-09-05",
    weightKg: 60.5,
  };

  const savedEntry = {
    id: "entry-1",
    date: "2026-09-05",
    weightKg: 60.5,
  };

  const plan = {
    id: "plan-1",
    version: 1,
    goal: "lose" as const,
    targetCalories: 2100,
    proteinG: 140,
    carbsG: 230,
    fatG: 70,
    createdAt: "2026-08-01T00:00:00.000Z",
  };

  function createDependencies() {
    const recordWeightService = {
      execute: vi.fn().mockResolvedValue(savedEntry),
    } satisfies Pick<RecordWeightEntryService, "execute">;

    const nutritionPlanRepository = {
      findLatestByUserId: vi.fn().mockResolvedValue(plan),
    } satisfies Pick<NutritionPlanRepository, "findLatestByUserId">;

    const evaluationRepository = {
      findLatestByPlanVersionId: vi.fn().mockResolvedValue(null),
    } satisfies Pick<
      ProgressEvaluationRepository,
      "findLatestByPlanVersionId"
    >;

    const evaluateAndRecordProgressService = {
      execute: vi.fn().mockResolvedValue({
        evaluation: {
          state: "INSUFFICIENT_DATA",
          changeKg: null,
          entriesCount: 1,
          evaluationDays: null,
        },
      }),
    } satisfies Pick<EvaluateAndRecordProgressService, "execute">;

    return {
      recordWeightService,
      nutritionPlanRepository,
      evaluationRepository,
      evaluateAndRecordProgressService,
    };
  }

  it("records the weight and evaluates when there is no prior evaluation", async () => {
    const dependencies = createDependencies();

    const service = new RecordWeightAndEvaluateService(
      dependencies.recordWeightService,
      dependencies.nutritionPlanRepository,
      dependencies.evaluationRepository,
      dependencies.evaluateAndRecordProgressService,
    );

    await expect(service.execute("user-1", entry)).resolves.toEqual({
      entry: savedEntry,
      evaluationTriggered: true,
    });

    expect(
      dependencies.recordWeightService.execute,
    ).toHaveBeenCalledWith("user-1", entry);

    expect(
      dependencies.evaluationRepository.findLatestByPlanVersionId,
    ).toHaveBeenCalledWith("user-1", "plan-1");

    expect(
      dependencies.evaluateAndRecordProgressService.execute,
    ).toHaveBeenCalledWith("user-1");
  });

  it("does not evaluate again inside the cadence window", async () => {
    const dependencies = createDependencies();

    dependencies.evaluationRepository.findLatestByPlanVersionId.mockResolvedValue(
      {
        id: "evaluation-1",
        userId: "user-1",
        planVersionId: "plan-1",
        state: "ON_TRACK",
        changeKg: -0.6,
        entriesCount: 3,
        evaluationDays: 14,
        recommendedAction: "CONTINUE",
        recommendationReason: "on_track",
        evaluatedAt: new Date(
          Date.now() -
            (PROGRESS_EVALUATION_CADENCE_DAYS * 24 * 60 * 60 * 1000 - 1000),
        ).toISOString(),
      },
    );

    const service = new RecordWeightAndEvaluateService(
      dependencies.recordWeightService,
      dependencies.nutritionPlanRepository,
      dependencies.evaluationRepository,
      dependencies.evaluateAndRecordProgressService,
    );

    await expect(service.execute("user-1", entry)).resolves.toEqual({
      entry: savedEntry,
      evaluationTriggered: false,
    });

    expect(
      dependencies.evaluateAndRecordProgressService.execute,
    ).not.toHaveBeenCalled();
  });

  it("evaluates again when the cadence window has elapsed", async () => {
    const dependencies = createDependencies();

    dependencies.evaluationRepository.findLatestByPlanVersionId.mockResolvedValue(
      {
        id: "evaluation-1",
        userId: "user-1",
        planVersionId: "plan-1",
        state: "ON_TRACK",
        changeKg: -0.6,
        entriesCount: 3,
        evaluationDays: 14,
        recommendedAction: "CONTINUE",
        recommendationReason: "on_track",
        evaluatedAt: new Date(
          Date.now() -
            (PROGRESS_EVALUATION_CADENCE_DAYS * 24 * 60 * 60 * 1000 + 1000),
        ).toISOString(),
      },
    );

    const service = new RecordWeightAndEvaluateService(
      dependencies.recordWeightService,
      dependencies.nutritionPlanRepository,
      dependencies.evaluationRepository,
      dependencies.evaluateAndRecordProgressService,
    );

    await expect(service.execute("user-1", entry)).resolves.toEqual({
      entry: savedEntry,
      evaluationTriggered: true,
    });

    expect(
      dependencies.evaluateAndRecordProgressService.execute,
    ).toHaveBeenCalledWith("user-1");
  });

  it("evaluates immediately for a newly active plan", async () => {
    const dependencies = createDependencies();

    dependencies.evaluationRepository.findLatestByPlanVersionId.mockResolvedValue(
      null,
    );

    const service = new RecordWeightAndEvaluateService(
      dependencies.recordWeightService,
      dependencies.nutritionPlanRepository,
      dependencies.evaluationRepository,
      dependencies.evaluateAndRecordProgressService,
    );

    await service.execute("user-1", entry);

    expect(
      dependencies.evaluateAndRecordProgressService.execute,
    ).toHaveBeenCalledWith("user-1");
  });

  it("still records the weight when there is no current plan", async () => {
    const dependencies = createDependencies();

    dependencies.nutritionPlanRepository.findLatestByUserId.mockResolvedValue(
      null,
    );

    const service = new RecordWeightAndEvaluateService(
      dependencies.recordWeightService,
      dependencies.nutritionPlanRepository,
      dependencies.evaluationRepository,
      dependencies.evaluateAndRecordProgressService,
    );

    await expect(service.execute("user-1", entry)).resolves.toEqual({
      entry: savedEntry,
      evaluationTriggered: false,
    });

    expect(
      dependencies.evaluateAndRecordProgressService.execute,
    ).not.toHaveBeenCalled();
  });
});
