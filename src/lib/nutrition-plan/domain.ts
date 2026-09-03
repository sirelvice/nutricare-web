import type { Goal } from "@/lib/profile/domain";

export type NutritionPlan = {
  id: string;
  version: number;
  goal: Goal;
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  createdAt: string;
};

export type NewNutritionPlan = Omit<NutritionPlan, "id" | "createdAt">;

export function validateNutritionPlan(plan: NewNutritionPlan): boolean {
  if (!Number.isInteger(plan.version) || plan.version < 1) return false;

  if (!Number.isFinite(plan.targetCalories) || plan.targetCalories <= 0) {
    return false;
  }

  if (!Number.isFinite(plan.proteinG) || plan.proteinG < 0) return false;
  if (!Number.isFinite(plan.carbsG) || plan.carbsG < 0) return false;
  if (!Number.isFinite(plan.fatG) || plan.fatG < 0) return false;

  return true;
}
