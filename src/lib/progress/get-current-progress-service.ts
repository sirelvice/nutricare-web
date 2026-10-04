import type { NutritionPlanRepository } from "@/lib/nutrition-plan/repository";
import type { ProgressEvaluationRepository } from "./repositories/progress-evaluation-repository";
import {
  describeProgressState,
  describeProgressSummary,
  describeRecommendation,
} from "./presentation";

export type CurrentProgressResult = {
  evaluation: {
    id: string;
    state: "ON_TRACK" | "BEHIND_OPPOSITE" | "PLATEAU" | "INSUFFICIENT_DATA";
    changeKg: number | null;
    entriesCount: number;
    evaluationDays: number | null;
    evaluatedAt: string;
    headline: string;
    summary: string;
  };
  recommendation: {
    recommendedAction:
      | "CONTINUE"
      | "REVIEW_ADHERENCE"
      | "CONSIDER_ADJUSTMENT"
      | "SUGGEST_PROFESSIONAL_CONSULT";
    reason:
      | "insufficient_data"
      | "on_track"
      | "first_problem"
      | "consecutive_problem"
      | "recurrence_after_adjustment";
    adjustmentDecision: "PENDING" | "ACCEPTED" | "DECLINED";
    respondedAt: string | null;
    message: string;
  };
  planVersionId: string;
};

export class GetCurrentProgressService {
  constructor(
    private readonly nutritionPlanRepository: NutritionPlanRepository,
    private readonly evaluationRepository: ProgressEvaluationRepository,
  ) {}

  async execute(userId: string): Promise<CurrentProgressResult | null> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const currentPlan =
      await this.nutritionPlanRepository.findLatestByUserId(userId);

    if (!currentPlan) {
      return null;
    }

    const evaluation =
      await this.evaluationRepository.findLatestByPlanVersionId(
        userId,
        currentPlan.id,
      );

    if (!evaluation) {
      return null;
    }

    return {
      planVersionId: currentPlan.id,
      evaluation: {
        id: evaluation.id,
        state: evaluation.state,
        changeKg: evaluation.changeKg,
        entriesCount: evaluation.entriesCount,
        evaluationDays: evaluation.evaluationDays,
        evaluatedAt: evaluation.evaluatedAt,
        headline: describeProgressState(currentPlan.goal, evaluation.state),
        summary: describeProgressSummary(
          evaluation.state,
          evaluation.changeKg,
          evaluation.evaluationDays,
        ),
      },
      recommendation: {
        recommendedAction: evaluation.recommendedAction,
        reason: evaluation.recommendationReason,
        adjustmentDecision: evaluation.adjustmentDecision,
        respondedAt: evaluation.respondedAt,
        message: describeRecommendation(
          evaluation.recommendedAction,
          evaluation.recommendationReason,
        ),
      },
    };
  }
}
