import { getPersonalisationAgeStatus } from "@/lib/profile/personalisation-eligibility";

export const RECOMMENDATION_ELIGIBILITY_MESSAGES = {
  RECOMMENDATIONS_AGE_REQUIRED: "Add a valid age to your profile before using personalised recommendations.",
  RECOMMENDATIONS_AGE_UNSUPPORTED: "Personalised recommendations currently support people aged 20 and over. Younger users need age-specific guidance from a qualified health professional.",
} as const;

export type RecommendationEligibilityCode = keyof typeof RECOMMENDATION_ELIGIBILITY_MESSAGES;

export class RecommendationEligibilityError extends Error {
  constructor(public readonly code: RecommendationEligibilityCode) {
    super(RECOMMENDATION_ELIGIBILITY_MESSAGES[code]);
    this.name = "RecommendationEligibilityError";
  }
}

export function assertRecommendationAge(age: number | null) {
  const status = getPersonalisationAgeStatus(age);
  if (status === "age-required") {
    throw new RecommendationEligibilityError("RECOMMENDATIONS_AGE_REQUIRED");
  }
  // Product scope: adult BMI guidance starts at 20. WHO publishes separate
  // BMI-for-age references for ages 5–19; this flow does not implement those.
  if (status === "age-unsupported") {
    throw new RecommendationEligibilityError("RECOMMENDATIONS_AGE_UNSUPPORTED");
  }
}
