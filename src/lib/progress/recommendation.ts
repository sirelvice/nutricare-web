import type { ProgressState } from "./domain";

export type RecommendedAction =
  | "CONTINUE"
  | "REVIEW_ADHERENCE"
  | "CONSIDER_ADJUSTMENT"
  | "SUGGEST_PROFESSIONAL_CONSULT";

export type RecommendationReason =
  | "insufficient_data"
  | "on_track"
  | "first_problem"
  | "consecutive_problem"
  | "recurrence_after_adjustment";

export type EvaluationSnapshot = {
  state: ProgressState;
  planVersionId: string;
  evaluatedAt: string;
};

export type PreviousPlanContext = {
  planVersionId: string;
  finalProblemState:
    | Extract<ProgressState, "PLATEAU" | "BEHIND_OPPOSITE">
    | null;
  wasAdjustment: boolean;
};

export type AdjustmentRecommendation = {
  recommendedAction: RecommendedAction;
  reason: RecommendationReason;
};

const PROBLEM_STATES = new Set<ProgressState>([
  "PLATEAU",
  "BEHIND_OPPOSITE",
]);

function isProblemState(state: ProgressState): boolean {
  return PROBLEM_STATES.has(state);
}

function getTrailingProblemCount(
  currentEvaluation: EvaluationSnapshot,
  evaluationHistory: EvaluationSnapshot[],
): number {
  const currentPlanHistory = [...evaluationHistory, currentEvaluation]
    .filter(
      (evaluation) =>
        evaluation.planVersionId === currentEvaluation.planVersionId,
    )
    .sort((a, b) => a.evaluatedAt.localeCompare(b.evaluatedAt));

  let count = 0;

  for (let index = currentPlanHistory.length - 1; index >= 0; index -= 1) {
    if (!isProblemState(currentPlanHistory[index].state)) {
      break;
    }

    count += 1;
  }

  return count;
}

function isImmediateRecurrence(
  currentEvaluation: EvaluationSnapshot,
  previousPlanContext: PreviousPlanContext | null,
): boolean {
  if (!previousPlanContext?.wasAdjustment) {
    return false;
  }

  if (
    previousPlanContext.finalProblemState === null ||
    !isProblemState(currentEvaluation.state)
  ) {
    return false;
  }

  return true;
}

export function recommendAdjustment(params: {
  currentEvaluation: EvaluationSnapshot;
  evaluationHistory: EvaluationSnapshot[];
  previousPlanContext: PreviousPlanContext | null;
}): AdjustmentRecommendation {
  const {
    currentEvaluation,
    evaluationHistory,
    previousPlanContext,
  } = params;

  switch (currentEvaluation.state) {
    case "INSUFFICIENT_DATA":
      return {
        recommendedAction: "CONTINUE",
        reason: "insufficient_data",
      };

    case "ON_TRACK":
      return {
        recommendedAction: "CONTINUE",
        reason: "on_track",
      };

    case "PLATEAU":
    case "BEHIND_OPPOSITE": {
      if (isImmediateRecurrence(currentEvaluation, previousPlanContext)) {
        return {
          recommendedAction: "SUGGEST_PROFESSIONAL_CONSULT",
          reason: "recurrence_after_adjustment",
        };
      }

      const consecutiveProblemCount = getTrailingProblemCount(
        currentEvaluation,
        evaluationHistory,
      );

      if (consecutiveProblemCount >= 2) {
        return {
          recommendedAction: "CONSIDER_ADJUSTMENT",
          reason: "consecutive_problem",
        };
      }

      return {
        recommendedAction: "REVIEW_ADHERENCE",
        reason: "first_problem",
      };
    }
  }
}
