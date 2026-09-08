import { describe, expect, it, vi } from "vitest";
import type { NutritionPlanRepository } from "@/lib/nutrition-plan/repository";
import type { ProgressEvaluationRepository } from "./repositories/progress-evaluation-repository";
import { GetCurrentProgressService } from "./get-current-progress-service";

const planRepository = {
  findLatestByUserId: vi.fn(),
} as unknown as NutritionPlanRepository;

const evaluationRepository = {
  findLatestByPlanVersionId: vi.fn(),
} as unknown as ProgressEvaluationRepository;

describe("GetCurrentProgressService", () => {
  it("rejects a missing user ID", async () => {
    const service = new GetCurrentProgressService(
      planRepository,
      evaluationRepository,
    );

    await expect(service.execute("")).rejects.toThrow("User ID is required");
  });

  it("returns null when there is no current plan", async () => {
    vi.mocked(planRepository.findLatestByUserId).mockResolvedValue(null);

    const service = new GetCurrentProgressService(
      planRepository,
      evaluationRepository,
    );

    await expect(service.execute("user-1")).resolves.toBeNull();
    expect(
      evaluationRepository.findLatestByPlanVersionId,
    ).not.toHaveBeenCalled();
  });

  it("returns null when the current plan has no persisted evaluation", async () => {
    vi.mocked(planRepository.findLatestByUserId).mockResolvedValue({
      id: "plan-2",
      version: 2,
      goal: "lose",
      targetCalories: 2000,
      proteinG: 150,
      carbsG: 225,
      fatG: 56,
      createdAt: "2026-10-01T00:00:00.000Z",
    });

    vi.mocked(
      evaluationRepository.findLatestByPlanVersionId,
    ).mockResolvedValue(null);

    const service = new GetCurrentProgressService(
      planRepository,
      evaluationRepository,
    );

    await expect(service.execute("user-1")).resolves.toBeNull();

    expect(
      evaluationRepository.findLatestByPlanVersionId,
    ).toHaveBeenCalledWith("user-1", "plan-2");
  });

  it("returns the current plan evaluation and persisted recommendation", async () => {
    vi.mocked(planRepository.findLatestByUserId).mockResolvedValue({
      id: "plan-2",
      version: 2,
      goal: "lose",
      targetCalories: 2000,
      proteinG: 150,
      carbsG: 225,
      fatG: 56,
      createdAt: "2026-10-01T00:00:00.000Z",
    });

    vi.mocked(
      evaluationRepository.findLatestByPlanVersionId,
    ).mockResolvedValue({
      id: "evaluation-2",
      userId: "user-1",
      planVersionId: "plan-2",
      state: "PLATEAU",
      changeKg: 0.2,
      entriesCount: 4,
      evaluationDays: 21,
      recommendedAction: "CONSIDER_ADJUSTMENT",
      recommendationReason: "consecutive_problem",
      adjustmentDecision: "PENDING",
      respondedAt: null,
      evaluatedAt: "2026-10-21T12:00:00.000Z",
    });

    const service = new GetCurrentProgressService(
      planRepository,
      evaluationRepository,
    );

    await expect(service.execute("user-1")).resolves.toEqual({
      planVersionId: "plan-2",
      evaluation: {
        id: "evaluation-2",
        state: "PLATEAU",
        changeKg: 0.2,
        entriesCount: 4,
        evaluationDays: 21,
        evaluatedAt: "2026-10-21T12:00:00.000Z",
        headline: "Your weight has changed very little so far",
        summary: "Your logged weight increased by 0.2 kg over 21 days.",
      },
      recommendation: {
        recommendedAction: "CONSIDER_ADJUSTMENT",
        reason: "consecutive_problem",
        adjustmentDecision: "PENDING",
        respondedAt: null,
        message:
          "Your recent results suggest it may be time to review and adjust your current plan.",
      },
    });
  });

  it("does not return an evaluation belonging to an older plan", async () => {
    vi.mocked(planRepository.findLatestByUserId).mockResolvedValue({
      id: "plan-2",
      version: 2,
      goal: "lose",
      targetCalories: 2000,
      proteinG: 150,
      carbsG: 225,
      fatG: 56,
      createdAt: "2026-10-01T00:00:00.000Z",
    });

    vi.mocked(
      evaluationRepository.findLatestByPlanVersionId,
    ).mockResolvedValue(null);

    const service = new GetCurrentProgressService(
      planRepository,
      evaluationRepository,
    );

    await expect(service.execute("user-1")).resolves.toBeNull();

    expect(
      evaluationRepository.findLatestByPlanVersionId,
    ).toHaveBeenCalledWith("user-1", "plan-2");
  });
});
