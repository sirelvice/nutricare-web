import { describe, expect, it, vi } from "vitest";
import { submitAdjustment } from "./adjustment-client";

const decision = { evaluationId: "evaluation-1", adjustmentDecision: "ACCEPTED", respondedAt: "2026-10-07T00:00:00Z", plan: {
  id: "plan-2", version: 2, goal: "lose", targetCalories: 2000, proteinG: 100, carbsG: 250, fatG: 67, createdAt: "2026-10-07T00:00:00Z",
} };
describe("adjustment writes", () => {
  it("validates an accepted decision and its persisted plan", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json(decision));
    await expect(submitAdjustment("evaluation-1", "ACCEPTED", request)).resolves.toMatchObject(decision);
    expect(request).toHaveBeenCalledWith("/api/progress/adjustment", expect.objectContaining({ method: "POST", credentials: "same-origin" }));
  });
  it("accepts a matching decline without a new plan", async () => {
    const result = { ...decision, adjustmentDecision: "DECLINED", plan: undefined };
    await expect(submitAdjustment("evaluation-1", "DECLINED", vi.fn<typeof fetch>().mockResolvedValue(Response.json(result)))).resolves.toMatchObject({ adjustmentDecision: "DECLINED", plan: null });
  });
  it.each([
    {}, { ...decision, evaluationId: "other" }, { ...decision, adjustmentDecision: "DECLINED" },
    { ...decision, respondedAt: "bad date" }, { ...decision, plan: null }, { ...decision, plan: { ...decision.plan, targetCalories: "2000" } },
  ])("requires a read after an invalid successful response", async (body) => {
    await expect(submitAdjustment("evaluation-1", "ACCEPTED", vi.fn<typeof fetch>().mockResolvedValue(Response.json(body)))).rejects.toMatchObject({ kind: "uncertain" });
  });
  it.each([[409, "conflict"], [500, "uncertain"], [201, "uncertain"], [400, "rejected"], [401, "rejected"], [403, "rejected"]] as const)("classifies status %s without exposing error text", async (status, kind) => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ error: "private detail" }, { status }));
    await expect(submitAdjustment("evaluation-1", "ACCEPTED", request)).rejects.toMatchObject({ kind });
  });
  it("does not retry a lost response", async () => {
    const request = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("failed"));
    await expect(submitAdjustment("evaluation-1", "ACCEPTED", request)).rejects.toMatchObject({ kind: "uncertain" });
    expect(request).toHaveBeenCalledTimes(1);
  });
});
