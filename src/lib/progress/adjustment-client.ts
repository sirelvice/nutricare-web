import { z } from "zod";
import { parseNutritionPlanResponse } from "@/lib/nutrition-plan/client";

const responseSchema = z.object({
  evaluationId: z.string().min(1),
  adjustmentDecision: z.enum(["ACCEPTED", "DECLINED"]),
  respondedAt: z.iso.datetime({ offset: true }),
  plan: z.unknown().optional(),
});

export class AdjustmentRequestError extends Error {
  constructor(readonly kind: "conflict" | "rejected" | "uncertain") {
    super(kind === "conflict"
      ? "Your progress recommendation changed. Reload current progress before responding again."
      : kind === "rejected" ? "Unable to record your adjustment decision."
      : "We could not confirm whether your decision was saved. Reload current progress before responding again.");
    this.name = "AdjustmentRequestError";
  }
}

export async function submitAdjustment(
  evaluationId: string,
  decision: "ACCEPTED" | "DECLINED",
  request: typeof fetch = fetch,
) {
  let response: Response;
  try {
    response = await request("/api/progress/adjustment", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evaluationId, decision }),
    });
  } catch { throw new AdjustmentRequestError("uncertain"); }
  if (response.status === 409) throw new AdjustmentRequestError("conflict");
  if ([400, 401, 403].includes(response.status)) throw new AdjustmentRequestError("rejected");
  if (response.status !== 200) throw new AdjustmentRequestError("uncertain");
  try {
    const result = responseSchema.parse(await response.json());
    if (result.evaluationId !== evaluationId || result.adjustmentDecision !== decision) throw new Error("Mismatched decision");
    const plan = decision === "ACCEPTED" ? parseNutritionPlanResponse({ plan: result.plan }) : null;
    if (decision === "ACCEPTED" && !plan) throw new Error("Missing adjusted plan");
    return { ...result, plan };
  } catch { throw new AdjustmentRequestError("uncertain"); }
}
