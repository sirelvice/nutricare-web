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

    const [entries, currentPlan, history] = await Promise.all([
      this.weightRepository.findByUserId(userId),
      this.nutritionPlanRepository.findLatestByUserId(userId),
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
      previousPlanContext: null,
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
