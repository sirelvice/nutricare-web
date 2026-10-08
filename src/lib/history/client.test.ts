import { describe, expect, it, vi } from "vitest";
import { comparePlans, parsePlanHistory, readPlanHistory } from "./client";

const plan = { id: "plan-1", version: 1, goal: "lose" as const, targetCalories: 2000,
  proteinG: 100, carbsG: 250, fatG: 60, createdAt: "2026-10-01T00:00:00Z" };

describe("saved plan history", () => {
  it("accepts an explicit empty history", () => expect(parsePlanHistory({ plans: [] })).toEqual([]));
  it("sorts versions without mutating the response", () => {
    const input = { plans: [plan, { ...plan, id: "plan-2", version: 2 }] };
    expect(parsePlanHistory(input).map((item) => item.version)).toEqual([2, 1]);
    expect(input.plans[0].version).toBe(1);
  });
  it.each([null, {}, { plans: null }, { plans: [null] }, { plans: [{}] },
    { plans: [{ ...plan, version: 0 }] }, { plans: [{ ...plan, createdAt: "not a date" }] },
    { plans: [{ ...plan, targetCalories: "2000" }] },
  ])("rejects malformed history %j", (value) => expect(() => parsePlanHistory(value)).toThrow());
  it("rejects duplicate IDs or versions", () => {
    expect(() => parsePlanHistory({ plans: [plan, { ...plan, version: 2 }] })).toThrow();
    expect(() => parsePlanHistory({ plans: [plan, { ...plan, id: "different" }] })).toThrow();
  });
  it("requests fresh session-owned history and forwards cancellation", async () => {
    const controller = new AbortController();
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ plans: [plan] }));
    await expect(readPlanHistory(controller.signal, request)).resolves.toEqual([plan]);
    expect(request).toHaveBeenCalledWith("/api/nutrition-plan/history", {
      cache: "no-store", credentials: "same-origin", signal: controller.signal,
    });
  });
  it("does not expose a failed response body", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ error: "private database text" }, { status: 500 }));
    await expect(readPlanHistory(new AbortController().signal, request)).rejects.toThrow("Unable to load saved plans.");
  });
  it("compares newer minus older regardless of selection order", () => {
    const newer = { ...plan, id: "plan-3", version: 3, targetCalories: 2100, proteinG: 105, carbsG: 240, fatG: 60 };
    expect(comparePlans(newer, plan)).toMatchObject({ older: plan, newer, calories: 100, protein: 5, carbs: -10, fat: 0 });
  });
});
