import { z } from "zod";
import { profileSchema } from "@/lib/profile/schema";
import { parseWeightHistory } from "@/lib/tracking/client";
import { parseNutritionPlanResponse } from "@/lib/nutrition-plan/client";

const progressSchema = z.object({
  planVersionId: z.string().min(1),
  evaluation: z.object({
    id: z.string().min(1), state: z.enum(["ON_TRACK", "BEHIND_OPPOSITE", "PLATEAU", "INSUFFICIENT_DATA"]),
    evaluatedAt: z.iso.datetime({ offset: true }), headline: z.string().min(1), summary: z.string().min(1),
  }),
  recommendation: z.object({ message: z.string().min(1) }),
});
const schema = z.object({
  generatedAt: z.iso.datetime({ offset: true }), profile: profileSchema,
  bmi: z.object({ latest: z.object({ value: z.number().positive(), category: z.object({ label: z.string().min(1), note: z.string() }) }).nullable() }),
  nutritionPlan: z.unknown().transform((plan) => parseNutritionPlanResponse({ plan })),
  weight: z.object({
    entriesCount: z.number().int().nonnegative(), entries: z.unknown().transform(parseWeightHistory),
    stats: z.object({ first: z.object({ date: z.string(), weightKg: z.number().positive() }), last: z.object({ date: z.string(), weightKg: z.number().positive() }), change: z.number(), count: z.number().int().positive() }).nullable(),
  }),
  progress: progressSchema.nullable(),
}).refine((value) => value.weight.entriesCount === value.weight.entries.length, "Inconsistent record count");
export type ReportSnapshot = z.infer<typeof schema>;
export function parseReport(value: unknown): ReportSnapshot {
  const result = schema.parse(value);
  if (result.progress && result.progress.planVersionId !== result.nutritionPlan?.id) {
    throw new Error("Progress belongs to a different plan.");
  }
  return result;
}
export async function readReport(signal: AbortSignal): Promise<ReportSnapshot | null> {
  const response = await fetch("/api/report", { cache: "no-store", credentials: "same-origin", signal });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Unable to load your report.");
  return parseReport(await response.json());
}
export async function readReportPDF(signal: AbortSignal): Promise<Blob> {
  const response = await fetch("/api/report/pdf", { cache: "no-store", credentials: "same-origin", signal });
  if (!response.ok || response.headers.get("Content-Type")?.split(";")[0].trim() !== "application/pdf") {
    throw new Error("Unable to download your report.");
  }
  const blob = await response.blob();
  const signature = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
  if (new TextDecoder().decode(signature) !== "%PDF-") throw new Error("Invalid PDF response.");
  return blob;
}
