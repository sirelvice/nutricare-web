import { z } from "zod";
import { parseNutritionPlanResponse } from "@/lib/nutrition-plan/client";
import type { NutritionPlan } from "@/lib/nutrition-plan/domain";

export function parsePlanHistory(value: unknown): NutritionPlan[] {
  const body = z.object({ plans: z.array(z.unknown()) }).parse(value);
  const plans = body.plans.map((plan) => {
    const parsed = parseNutritionPlanResponse({ plan });
    if (!parsed) throw new Error("Invalid saved plan.");
    return parsed;
  });
  const ids = new Set<string>();
  const versions = new Set<number>();
  for (const plan of plans) {
    if (ids.has(plan.id) || versions.has(plan.version)) throw new Error("Duplicate saved plan.");
    ids.add(plan.id); versions.add(plan.version);
  }
  return plans.sort((a, b) => b.version - a.version);
}

export async function readPlanHistory(signal: AbortSignal, request: typeof fetch = fetch) {
  const response = await request("/api/nutrition-plan/history", {
    cache: "no-store", credentials: "same-origin", signal,
  });
  if (!response.ok) throw new Error("Unable to load saved plans.");
  return parsePlanHistory(await response.json());
}

// Comparisons describe persisted target differences, not their cause or outcome.
export function comparePlans(a: NutritionPlan, b: NutritionPlan) {
  const [older, newer] = a.version < b.version ? [a, b] : [b, a];
  return {
    older, newer,
    calories: newer.targetCalories - older.targetCalories,
    protein: newer.proteinG - older.proteinG,
    carbs: newer.carbsG - older.carbsG,
    fat: newer.fatG - older.fatG,
  };
}
