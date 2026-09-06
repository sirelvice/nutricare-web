import { describe, expect, it, vi } from "vitest";
import { ApplyPlanAdjustmentService } from "./apply-plan-adjustment-service";
import type { NutritionPlanRepository } from "@/lib/nutrition-plan/repository";
import type { ProfileRepository } from "@/lib/profile/repositories/profile-repository";
import type { WeightRepository } from "@/lib/tracking/repositories/weight-repository";
import type { ProgressEvaluationRepository } from "./repositories/progress-evaluation-repository";
import type { AdjustmentWorkflowRepository } from "./repositories/adjustment-workflow-repository";

const evaluation = {
  id: "evaluation-1",
  userId: "user-1",
  planVersionId: "plan-1",
  state: "PLATEAU" as const,
  changeKg: 0.1,
  entriesCount: 5,
  evaluationDays: 28,
  recommendedAction: "CONSIDER_ADJUSTMENT" as const,
  recommendationReason: "consecutive_problem" as const,
  adjustmentDecision: "PENDING" as const,
  respondedAt: null,
  evaluatedAt: "2026-09-05T10:00:00.000Z",
};

const profile = {
  heightCm: 170,
  age: 30,
  gender: "male" as const,
  activity: "moderate" as const,
  goal: "lose" as const,
};

const currentPlan = {
  id: "plan-1",
  version: 1,
  goal: "lose" as const,
  targetCalories: 2053,
  proteinG: 154,
  carbsG: 231,
  fatG: 57,
  createdAt: "2026-09-01T10:00:00.000Z",
};

const weight = {
  id: "weight-1",
  date: "2026-09-10",
  weightKg: 60,
};

function createDependencies() {
  const evaluationRepository = {
    findById: vi.fn().mockResolvedValue(evaluation),
  } as unknown as ProgressEvaluationRepository;

  const nutritionPlanRepository = {
    findLatestByUserId: vi.fn().mockResolvedValue(currentPlan),
  } as unknown as NutritionPlanRepository;

  const profileRepository = {
    findByUserId: vi.fn().mockResolvedValue(profile),
  } as unknown as ProfileRepository;

  const weightRepository = {
    findLatestByUserId: vi.fn().mockResolvedValue(weight),
  } as unknown as WeightRepository;

  const adjustmentWorkflowRepository = {
    applyAcceptedAdjustment: vi.fn().mockResolvedValue({
      plan: {
        ...currentPlan,
        id: "plan-2",
        version: 2,
        targetCalories: 2053,
        createdAt: "2026-09-10T12:00:00.000Z",
      },
      evaluationId: evaluation.id,
      adjustmentDecision: "ACCEPTED" as const,
      respondedAt: "2026-09-10T12:00:00.000Z",
    }),
  } as unknown as AdjustmentWorkflowRepository;

  return {
    evaluationRepository,
    nutritionPlanRepository,
    profileRepository,
    weightRepository,
    adjustmentWorkflowRepository,
  };
}

describe("ApplyPlanAdjustmentService", () => {
  it("rejects a missing user ID", async () => {
    const dependencies = createDependencies();
    const service = new ApplyPlanAdjustmentService(
      dependencies.evaluationRepository,
      dependencies.nutritionPlanRepository,
      dependencies.profileRepository,
      dependencies.weightRepository,
      dependencies.adjustmentWorkflowRepository,
    );

    await expect(service.execute("", "evaluation-1")).rejects.toThrow(
      "User ID is required",
    );
  });

  it("rejects a missing evaluation ID", async () => {
    const dependencies = createDependencies();
    const service = new ApplyPlanAdjustmentService(
      dependencies.evaluationRepository,
      dependencies.nutritionPlanRepository,
      dependencies.profileRepository,
      dependencies.weightRepository,
      dependencies.adjustmentWorkflowRepository,
    );

    await expect(service.execute("user-1", "")).rejects.toThrow(
      "Evaluation ID is required",
    );
  });

  it("rejects a missing evaluation", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.evaluationRepository.findById).mockResolvedValue(
      null,
    );

    const service = new ApplyPlanAdjustmentService(
      dependencies.evaluationRepository,
      dependencies.nutritionPlanRepository,
      dependencies.profileRepository,
      dependencies.weightRepository,
      dependencies.adjustmentWorkflowRepository,
    );

    await expect(
      service.execute("user-1", "evaluation-1"),
    ).rejects.toThrow("Progress evaluation not found");
  });

  it("rejects evaluations that are not adjustment recommendations", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.evaluationRepository.findById).mockResolvedValue({
      ...evaluation,
      recommendedAction: "REVIEW_ADHERENCE",
    });

    const service = new ApplyPlanAdjustmentService(
      dependencies.evaluationRepository,
      dependencies.nutritionPlanRepository,
      dependencies.profileRepository,
      dependencies.weightRepository,
      dependencies.adjustmentWorkflowRepository,
    );

    await expect(
      service.execute("user-1", "evaluation-1"),
    ).rejects.toThrow("Adjustment response is not applicable");

    expect(
      dependencies.adjustmentWorkflowRepository.applyAcceptedAdjustment,
    ).not.toHaveBeenCalled();
  });

  it("rejects already-responded evaluations", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.evaluationRepository.findById).mockResolvedValue({
      ...evaluation,
      adjustmentDecision: "ACCEPTED",
    });

    const service = new ApplyPlanAdjustmentService(
      dependencies.evaluationRepository,
      dependencies.nutritionPlanRepository,
      dependencies.profileRepository,
      dependencies.weightRepository,
      dependencies.adjustmentWorkflowRepository,
    );

    await expect(
      service.execute("user-1", "evaluation-1"),
    ).rejects.toThrow("Adjustment decision has already been recorded");

    expect(
      dependencies.adjustmentWorkflowRepository.applyAcceptedAdjustment,
    ).not.toHaveBeenCalled();
  });

  it("rejects stale recommendations from an older plan version", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.nutritionPlanRepository.findLatestByUserId).mockResolvedValue({
      ...currentPlan,
      id: "plan-2",
      version: 2,
    });

    const service = new ApplyPlanAdjustmentService(
      dependencies.evaluationRepository,
      dependencies.nutritionPlanRepository,
      dependencies.profileRepository,
      dependencies.weightRepository,
      dependencies.adjustmentWorkflowRepository,
    );

    await expect(
      service.execute("user-1", "evaluation-1"),
    ).rejects.toThrow("Nutrition plan has changed since the recommendation");

    expect(
      dependencies.adjustmentWorkflowRepository.applyAcceptedAdjustment,
    ).not.toHaveBeenCalled();
  });

  it("requires a profile", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.profileRepository.findByUserId).mockResolvedValue(
      null,
    );

    const service = new ApplyPlanAdjustmentService(
      dependencies.evaluationRepository,
      dependencies.nutritionPlanRepository,
      dependencies.profileRepository,
      dependencies.weightRepository,
      dependencies.adjustmentWorkflowRepository,
    );

    await expect(
      service.execute("user-1", "evaluation-1"),
    ).rejects.toThrow("Profile not found");
  });

  it("requires a latest weight entry", async () => {
    const dependencies = createDependencies();
    vi.mocked(
      dependencies.weightRepository.findLatestByUserId,
    ).mockResolvedValue(null);

    const service = new ApplyPlanAdjustmentService(
      dependencies.evaluationRepository,
      dependencies.nutritionPlanRepository,
      dependencies.profileRepository,
      dependencies.weightRepository,
      dependencies.adjustmentWorkflowRepository,
    );

    await expect(
      service.execute("user-1", "evaluation-1"),
    ).rejects.toThrow("Weight entry is required to adjust the plan");
  });

  it("recalculates and applies the next plan version", async () => {
    const dependencies = createDependencies();

    const service = new ApplyPlanAdjustmentService(
      dependencies.evaluationRepository,
      dependencies.nutritionPlanRepository,
      dependencies.profileRepository,
      dependencies.weightRepository,
      dependencies.adjustmentWorkflowRepository,
    );

    const result = await service.execute("user-1", "evaluation-1");

    expect(
      dependencies.adjustmentWorkflowRepository.applyAcceptedAdjustment,
    ).toHaveBeenCalledWith(
      "user-1",
      "evaluation-1",
      "plan-1",
      expect.objectContaining({
        goal: "lose",
        targetCalories: 2053,
        proteinG: 154,
        carbsG: 231,
        fatG: 57,
      }),
    );

    expect(result.adjustmentDecision).toBe("ACCEPTED");
    expect(result.plan.version).toBe(2);
  });
});
