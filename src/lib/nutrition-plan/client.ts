import { parsePlanEligibilityCode } from "@/lib/nutrition-plan/eligibility";
import { z } from "zod";
import type { NutritionPlan } from "@/lib/nutrition-plan/domain";

const planSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().positive(),
  goal: z.enum(["lose", "maintain", "gain"]),
  targetCalories: z.number().int().positive(),
  proteinG: z.number().int().nonnegative(),
  carbsG: z.number().int().nonnegative(),
  fatG: z.number().int().nonnegative(),
  createdAt: z.iso.datetime({ offset: true }),
});
const responseSchema = z.object({ plan: planSchema.nullable() });

export type PlanRequestFailure = "load" | "prerequisites" | "conflict" | "uncertain" | "age-required" | "age-unsupported";

export class PlanRequestError extends Error {
  constructor(readonly kind: PlanRequestFailure) {
    super(`Nutrition plan request failed: ${kind}`);
    this.name = "PlanRequestError";
  }
}

export function parseNutritionPlanResponse(value: unknown): NutritionPlan | null {
  const result = responseSchema.safeParse(value);
  if (!result.success) throw new PlanRequestError("load");
  return result.data.plan;
}

export async function readNutritionPlan(
  signal: AbortSignal,
  request: typeof fetch = fetch,
): Promise<NutritionPlan | null> {
  const response = await request("/api/nutrition-plan", {
    signal, cache: "no-store", credentials: "same-origin",
  });
  if (!response.ok) {
    const kind = response.status === 422 ? parsePlanEligibilityCode(await response.json().catch(() => null)) : null;
    throw new PlanRequestError(kind ?? "load");
  }
  return parseNutritionPlanResponse(await response.json());
}

export async function createNutritionPlan(
  signal: AbortSignal,
  request: typeof fetch = fetch,
): Promise<NutritionPlan> {
  const response = await request("/api/nutrition-plan", {
    method: "POST", signal, credentials: "same-origin",
  });
  if (!response.ok) {
    if (response.status === 422) {
      const kind = parsePlanEligibilityCode(await response.json().catch(() => null));
      throw new PlanRequestError(kind ?? "prerequisites");
    }
    if (response.status === 409) {
      const data: unknown = await response.json().catch(() => null);
      if (data && typeof data === "object" && "code" in data && data.code === "NUTRITION_PLAN_CONFLICT") {
        throw new PlanRequestError("conflict");
      }
    }
    throw new PlanRequestError("uncertain");
  }

  if (response.status !== 201) throw new PlanRequestError("uncertain");

  // A successful write with an invalid response may already have persisted.
  // Require a read before offering another write rather than retrying silently.
  try {
    const plan = parseNutritionPlanResponse(await response.json());
    if (!plan) throw new PlanRequestError("uncertain");
    return plan;
  } catch {
    throw new PlanRequestError("uncertain");
  }
}
