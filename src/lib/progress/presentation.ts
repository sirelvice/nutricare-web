import type { Goal } from "@/lib/profile/domain";
import type { ProgressState } from "./domain";
import type {
  RecommendedAction,
  RecommendationReason,
} from "./recommendation";

export function describeProgressState(
  goal: Goal,
  state: ProgressState,
): string {
  switch (state) {
    case "ON_TRACK":
      return goal === "maintain"
        ? "Your weight is staying fairly steady"
        : "You're moving toward your goal";

    case "BEHIND_OPPOSITE":
      return "Your recent weight change is moving away from your goal";

    case "PLATEAU":
      return "Your weight has changed very little so far";

    case "INSUFFICIENT_DATA":
      return "We need a little more history to understand your progress";
  }
}

export function describeProgressSummary(
  state: ProgressState,
  changeKg: number | null,
  evaluationDays: number | null,
): string {
  if (state === "INSUFFICIENT_DATA") {
    return "Keep logging your weight consistently. We'll use a longer view to give you a more meaningful picture.";
  }

  if (changeKg === null || evaluationDays === null) {
    return "We don't have enough information to describe the change yet.";
  }

  if (changeKg === 0) {
    return `Your logged weight stayed the same over ${evaluationDays} days.`;
  }

  const amount = Math.abs(changeKg).toFixed(1);
  const direction = changeKg > 0 ? "increased" : "decreased";

  return `Your logged weight ${direction} by ${amount} kg over ${evaluationDays} days.`;
}

export function describeRecommendation(
  action: RecommendedAction,
  reason: RecommendationReason,
): string {
  if (action === "CONTINUE") {
    return reason === "insufficient_data"
      ? "Keep logging your weight consistently so we can evaluate your progress with enough evidence."
      : "Continue with your current approach and keep tracking your progress.";
  }

  if (action === "REVIEW_ADHERENCE") {
    return "Review how consistently you've been following your current plan before making changes.";
  }

  if (action === "CONSIDER_ADJUSTMENT") {
    return "Your recent results suggest it may be time to review and adjust your current plan.";
  }

  return "This pattern has continued across plan periods. Consider discussing it with a qualified health professional.";
}
