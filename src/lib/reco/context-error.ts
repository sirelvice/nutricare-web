export class RecommendationContextError extends Error {
  readonly code = "RECOMMENDATIONS_PLAN_REVIEW_REQUIRED";
  constructor() {
    super("Your saved plan does not match your profile goal. Review your profile and nutrition plan before using this guidance.");
    this.name = "RecommendationContextError";
  }
}
