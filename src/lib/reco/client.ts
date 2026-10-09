import { z } from "zod";
import { RECOMMENDATION_ELIGIBILITY_MESSAGES } from "./eligibility";

const text = z.string().min(1);
const items = z.array(text).min(1);
const recommendationSchema = z.object({
  context: z.object({
    plan: z.object({ id: text, version: z.number().int().positive(), goal: z.enum(["lose", "maintain", "gain"]), createdAt: z.iso.datetime({ offset: true }) }),
    measurement: z.object({ date: z.iso.date(), weightKg: z.number().min(20).max(350) }),
  }),
  bmi: z.number().positive(),
  category: z.object({ label: text, note: text }),
  targetCalories: z.number().int().positive(),
  macros: z.object({ proteinG: z.number().int().nonnegative(), carbsG: z.number().int().nonnegative(), fatG: z.number().int().nonnegative() }),
  recommendations: z.object({
    summary: text, priorities: items, foodsToFocus: items, foodsToLimit: items,
    nextSteps: items, mealIdeas: items, mealIdeasNote: text, warnings: items,
    guidanceMode: z.enum(["general", "goal-review"]), contentVersion: text,
    actions: z.array(z.object({ id: text, title: text, reason: text,
      href: z.enum(["/profile", "/tools/calories", "/tools/tracking/weight"]),
    })).min(1),
    sources: z.array(z.object({ title: text, url: z.enum([
      "https://www.who.int/en/news-room/fact-sheets/detail/healthy-diet",
      "https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight",
    ]) })).min(1),
  }),
});
export type RecommendationData = z.infer<typeof recommendationSchema>;
export type RecommendationRead =
  | { kind: "ready"; data: RecommendationData }
  | { kind: "setup" }
  | { kind: "age-required" | "age-unsupported" | "plan-review"; message: string };

export function parseRecommendations(value: unknown): RecommendationData {
  return recommendationSchema.parse(value);
}

export async function readRecommendations(signal: AbortSignal): Promise<RecommendationRead> {
  const response = await fetch("/api/recommendations", { cache: "no-store", signal });
  if (response.status === 422 || response.status === 409) {
    const body: unknown = await response.json();
    const parsed = z.object({ code: text }).safeParse(body);
    if (parsed.success) {
      if (response.status === 409) {
        if (parsed.data.code === "RECOMMENDATIONS_PLAN_REVIEW_REQUIRED") return {
          kind: "plan-review", message: "Your saved plan does not match your profile goal. Review your profile and nutrition plan before using this guidance.",
        };
        throw new Error("Unable to load recommendations.");
      }
      if (parsed.data.code === "RECOMMENDATIONS_SETUP_REQUIRED") return { kind: "setup" };
      if (parsed.data.code === "RECOMMENDATIONS_AGE_REQUIRED") return {
        kind: "age-required", message: RECOMMENDATION_ELIGIBILITY_MESSAGES.RECOMMENDATIONS_AGE_REQUIRED,
      };
      if (parsed.data.code === "RECOMMENDATIONS_AGE_UNSUPPORTED") return {
        kind: "age-unsupported", message: RECOMMENDATION_ELIGIBILITY_MESSAGES.RECOMMENDATIONS_AGE_UNSUPPORTED,
      };
    }
    throw new Error("Unable to load recommendations.");
  }
  if (!response.ok) throw new Error("Unable to load recommendations.");
  return { kind: "ready", data: parseRecommendations(await response.json()) };
}
