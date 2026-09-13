import type { NutritionPlan } from "@/lib/nutrition-plan/domain";

export type DashboardProgressState =
  | "ON_TRACK"
  | "BEHIND_OPPOSITE"
  | "PLATEAU"
  | "INSUFFICIENT_DATA";

export type DashboardProgressEvaluation = {
  id: string;
  state: DashboardProgressState;
  changeKg: number | null;
  entriesCount: number;
  evaluationDays: number | null;
  headline: string;
  summary: string;
};

export type DashboardProgressRecommendation = {
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

export type DashboardPrimaryAction = {
  label: string;
  href: string | null;
};

export function getPrimaryAction({
  hasProfile,
  hasWeight,
  hasCalories,
}: {
  hasProfile: boolean;
  hasWeight: boolean;
  hasCalories: boolean;
}): DashboardPrimaryAction | null {
  if (!hasProfile) {
    return { label: "Add your details", href: "/profile" };
  }

  if (!hasWeight) {
    return {
      label: "Log your first weight",
      href: "/tools/tracking/weight",
    };
  }

  if (!hasCalories) {
    return { label: "Generate your nutrition plan", href: null };
  }

  return null;
}

export function getSetupProgress({
  hasProfile,
  hasWeight,
  hasCalories,
}: {
  hasProfile: boolean;
  hasWeight: boolean;
  hasCalories: boolean;
}): number {
  const completed = [hasProfile, hasWeight, hasCalories].filter(Boolean).length;
  return Math.round((completed / 3) * 100);
}

export function getOptionalLoadMessage(
  section: "progress" | "recommendations",
): string {
  if (section === "progress") {
    return "Progress information is temporarily unavailable. Your other dashboard information is still available.";
  }

  return "Recommendations are temporarily unavailable. Your other dashboard information is still available.";
}

export function getAdjustmentResultMessage({
  decision,
  nutritionPlan,
}: {
  decision: "ACCEPTED" | "DECLINED";
  nutritionPlan: NutritionPlan | null;
}): string {
  if (decision === "DECLINED") {
    return "You chose to keep your current plan for now.";
  }

  if (nutritionPlan) {
    return `Your new plan is active (version ${nutritionPlan.version}) with a target of ${nutritionPlan.targetCalories} kcal/day.`;
  }

  return "You accepted the recommendation and a new plan has been created.";
}
