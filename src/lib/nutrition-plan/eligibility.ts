import { getPersonalisationAgeStatus } from "@/lib/profile/personalisation-eligibility";

export const PLAN_ELIGIBILITY_MESSAGES = {
  "age-required": "Add a valid age to your profile before using personalised nutrition targets.",
  "age-unsupported": "Personalised nutrition targets currently support people aged 20 and over. Younger users need age-specific guidance from a qualified health professional.",
} as const;

export class PlanEligibilityError extends Error {
  constructor(readonly kind: keyof typeof PLAN_ELIGIBILITY_MESSAGES) {
    super(PLAN_ELIGIBILITY_MESSAGES[kind]);
    this.name = "PlanEligibilityError";
  }
}

export function assertPlanAge(age: number | null) {
  const status = getPersonalisationAgeStatus(age);
  if (status !== "ready") throw new PlanEligibilityError(status);
}

export function parsePlanEligibilityCode(value: unknown) {
  if (!value || typeof value !== "object" || !("code" in value)) return null;
  if (value.code === "NUTRITION_PLAN_AGE_REQUIRED") return "age-required" as const;
  if (value.code === "NUTRITION_PLAN_AGE_UNSUPPORTED") return "age-unsupported" as const;
  return null;
}
