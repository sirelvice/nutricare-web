import { getPersonalisationAgeStatus } from "@/lib/profile/personalisation-eligibility";
import {
  calcBMR,
  calcTDEE,
  goalCalories,
  type ActivityLevel,
  type Gender,
} from "@/lib/calc/metabolism";
import { calcMacros } from "@/lib/calc/macros";
import type { Goal, UserProfile } from "@/lib/profile/domain";

export type NutritionPlanCalculation = {
  goal: Goal;
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export function calculateNutritionPlan(params: {
  profile: UserProfile;
  weightKg: number;
}): NutritionPlanCalculation | null {
  const { profile, weightKg } = params;

  if (
    profile.heightCm === null ||
    profile.age === null ||
    getPersonalisationAgeStatus(profile.age) !== "ready" ||
    !Number.isFinite(weightKg)
  ) {
    return null;
  }

  const bmr = calcBMR({
    weightKg,
    heightCm: profile.heightCm,
    ageYears: profile.age,
    gender: profile.gender as Gender,
  });

  if (bmr === null) return null;

  const tdee = calcTDEE({
    bmr,
    activity: profile.activity as ActivityLevel,
  });

  if (tdee === null) return null;

  const targetCalories = goalCalories({
    tdee,
    goal: profile.goal,
  });

  const macros = calcMacros(targetCalories, profile.goal);

  return {
    goal: profile.goal,
    targetCalories,
    ...macros,
  };
}
