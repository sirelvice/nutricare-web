import { describe, expect, it, vi } from "vitest";
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
    return {
      recordWeightService: {
        execute: vi.fn().mockResolvedValue(savedEntry),
      },
      nutritionPlanRepository: {
        findLatestByUserId: vi.fn().mockResolvedValue(plan),
      },
      evaluationRepository: {
        findLatestByPlanVersionId: vi.fn().mockResolvedValue(null),
      },
      evaluateAndRecordProgressService: {
        execute: vi.fn().mockResolvedValue({
          evaluation: {
            state: "INSUFFICIENT_DATA",
            changeKg: null,
            entriesCount: 1,
            evaluationDays: null,
          },
        }),
      },
    };
  }

  it("records the weight and evaluates when there is no prior evaluation", async () => {
    const dependencies = createDependencies();

    const service = new RecordWeightAndEvaluateService(
      dependencies.recordWeightService as any,
      dependencies.nutritionPlanRepository as any,
      dependencies.evaluationRepository as any,
      dependencies.evaluateAndRecordProgressService as any,
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
      dependencies.recordWeightService as any,
      dependencies.nutritionPlanRepository as any,
      dependencies.evaluationRepository as any,
      dependencies.evaluateAndRecordProgressService as any,
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
      dependencies.recordWeightService as any,
      dependencies.nutritionPlanRepository as any,
      dependencies.evaluationRepository as any,
      dependencies.evaluateAndRecordProgressService as any,
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
      dependencies.recordWeightService as any,
      dependencies.nutritionPlanRepository as any,
      dependencies.evaluationRepository as any,
      dependencies.evaluateAndRecordProgressService as any,
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
      dependencies.recordWeightService as any,
      dependencies.nutritionPlanRepository as any,
      dependencies.evaluationRepository as any,
      dependencies.evaluateAndRecordProgressService as any,
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
