import { z } from "zod";

const progressSchema = z.object({ progress: z.object({
  planVersionId: z.string().min(1),
  evaluation: z.object({
    id: z.string().min(1),
    state: z.enum(["ON_TRACK", "BEHIND_OPPOSITE", "PLATEAU", "INSUFFICIENT_DATA"]),
    evaluatedAt: z.iso.datetime({ offset: true }),
    headline: z.string().min(1), summary: z.string().min(1),
  }),
  recommendation: z.object({
    recommendedAction: z.enum(["CONTINUE", "REVIEW_ADHERENCE", "CONSIDER_ADJUSTMENT", "SUGGEST_PROFESSIONAL_CONSULT"]),
    adjustmentDecision: z.enum(["PENDING", "ACCEPTED", "DECLINED"]),
    message: z.string().min(1),
  }),
}) });
export type GuidanceProgress =
  | { kind: "available"; progress: z.infer<typeof progressSchema>["progress"] }
  | { kind: "not-evaluated" | "outdated" };

export async function readGuidanceProgress(planId: string, signal: AbortSignal): Promise<GuidanceProgress> {
  const response = await fetch("/api/progress", { cache: "no-store", signal });
  if (response.status === 404) return { kind: "not-evaluated" };
  if (!response.ok) throw new Error("Progress is unavailable.");
  const { progress } = progressSchema.parse(await response.json());
  if (progress.planVersionId !== planId) return { kind: "outdated" };
  return { kind: "available", progress };
}
