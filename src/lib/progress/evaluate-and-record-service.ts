import type { NutritionPlanRepository } from "@/lib/nutrition-plan/repository";
import type { ProfileRepository } from "@/lib/profile/repositories/profile-repository";
import type { WeightRepository } from "@/lib/tracking/repositories/weight-repository";
import {
  evaluateProgress,
  type ProgressEvaluation,
} from "./domain";
import {
  recommendAdjustment,
  type AdjustmentRecommendation,
  type PreviousPlanContext,
} from "./recommendation";
import type {
  PersistedProgressEvaluation,
  ProgressEvaluationRepository,
} from "./repositories/progress-evaluation-repository";

export type EvaluateAndRecordProgressResult = {
  evaluation: ProgressEvaluation;
  recommendation: AdjustmentRecommendation;
  persistedEvaluation: PersistedProgressEvaluation;
};

export class EvaluateAndRecordProgressService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly weightRepository: WeightRepository,
    private readonly nutritionPlanRepository: NutritionPlanRepository,
    private readonly evaluationRepository: ProgressEvaluationRepository,
  ) {}

  async execute(
    userId: string,
  ): Promise<EvaluateAndRecordProgressResult | null> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const profile = await this.profileRepository.findByUserId(userId);

    if (!profile) {
      return null;
    }

    const [entries, currentPlan, plans, history] = await Promise.all([
      this.weightRepository.findByUserId(userId),
      this.nutritionPlanRepository.findLatestByUserId(userId),
      this.nutritionPlanRepository.findAllByUserId(userId),
      this.evaluationRepository.findByUserId(userId),
    ]);

    if (!currentPlan) {
      throw new Error("Current nutrition plan is required");
    }

    const periodEntries = entries.filter(
      (entry) => entry.date >= currentPlan.createdAt.slice(0, 10),
    );

    const evaluation = evaluateProgress({
      goal: currentPlan.goal,
      entries: periodEntries,
    });

    const evaluationTimestamp = new Date().toISOString();

    const previousPlan =
      plans.find((plan) => plan.version === currentPlan.version - 1) ?? null;

    const previousAdjustmentEvaluation = previousPlan
      ? history
          .filter(
            (item) =>
              item.planVersionId === previousPlan.id &&
              item.adjustmentDecision === "ACCEPTED",
          )
          .sort((a, b) => b.evaluatedAt.localeCompare(a.evaluatedAt))[0] ?? null
      : null;

    const previousPlanContext: PreviousPlanContext | null =
      previousPlan && previousAdjustmentEvaluation
        ? {
            planVersionId: previousPlan.id,
            finalProblemState:
              previousAdjustmentEvaluation.state === "PLATEAU" ||
              previousAdjustmentEvaluation.state === "BEHIND_OPPOSITE"
                ? previousAdjustmentEvaluation.state
                : null,
            wasAdjustment: true,
          }
        : null;

    const recommendation = recommendAdjustment({
      currentEvaluation: {
        state: evaluation.state,
        planVersionId: currentPlan.id,
        evaluatedAt: evaluationTimestamp,
      },
      evaluationHistory: history.map((item) => ({
        state: item.state,
        planVersionId: item.planVersionId,
        evaluatedAt: item.evaluatedAt,
      })),
      previousPlanContext,
    });

    const persistedEvaluation = await this.evaluationRepository.create(
      userId,
      {
        planVersionId: currentPlan.id,
        state: evaluation.state,
        changeKg: evaluation.changeKg,
        entriesCount: evaluation.entriesCount,
        evaluationDays: evaluation.evaluationDays,
        recommendedAction: recommendation.recommendedAction,
        recommendationReason: recommendation.reason,
      },
    );

    return {
      evaluation,
      recommendation,
      persistedEvaluation,
    };
  }
}
