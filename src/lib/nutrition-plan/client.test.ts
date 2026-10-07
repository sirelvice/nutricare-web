import { describe, expect, it, vi } from "vitest";
import { createNutritionPlan, parseNutritionPlanResponse, readNutritionPlan } from "@/lib/nutrition-plan/client";

const plan = {
  id: "plan-1", version: 1, goal: "maintain", targetCalories: 2200,
  proteinG: 138, carbsG: 275, fatG: 61, createdAt: "2026-10-07T00:00:00.000Z",
};

describe("nutrition plan response contract", () => {
  it("distinguishes an explicit empty plan from a validated plan", () => {
    expect(parseNutritionPlanResponse({ plan: null })).toBeNull();
    expect(parseNutritionPlanResponse({ plan })).toEqual(plan);
  });

  it.each([
    null, {}, { plan: undefined }, { plan: {} },
    { plan: { ...plan, id: "" } },
    { plan: { ...plan, version: 0 } },
    { plan: { ...plan, version: 1.5 } },
    { plan: { ...plan, goal: "unsupported" } },
    { plan: { ...plan, targetCalories: "2200" } },
    { plan: { ...plan, targetCalories: Infinity } },
    { plan: { ...plan, targetCalories: 0 } },
    { plan: { ...plan, proteinG: -1 } },
    { plan: { ...plan, carbsG: 1.5 } },
    { plan: { ...plan, fatG: NaN } },
    { plan: { ...plan, createdAt: "invalid" } },
  ])("rejects an invalid response: %j", (value) => {
    expect(() => parseNutritionPlanResponse(value)).toThrow();
  });
});

describe("nutrition plan requests", () => {
  it("reads without caching and forwards the cancellation signal", async () => {
    const signal = new AbortController().signal;
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ plan }));
    expect(await readNutritionPlan(signal, request)).toEqual(plan);
    expect(request).toHaveBeenCalledWith("/api/nutrition-plan", {
      signal, credentials: "same-origin", cache: "no-store",
    });
  });

  it("does not expose server error bodies on a failed read", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ error: "private detail" }, { status: 500 }));
    await expect(readNutritionPlan(new AbortController().signal, request)).rejects.toMatchObject({ kind: "load" });
  });

  it("creates a plan with a same-origin request and the cancellation signal", async () => {
    const signal = new AbortController().signal;
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ plan }, { status: 201 }));
    expect(await createNutritionPlan(signal, request)).toEqual(plan);
    expect(request).toHaveBeenCalledWith("/api/nutrition-plan", { method: "POST", signal, credentials: "same-origin" });
  });

  it.each([
    { status: 422, body: { error: "private detail" }, kind: "prerequisites" },
    { status: 409, body: { code: "NUTRITION_PLAN_CONFLICT", error: "private detail" }, kind: "conflict" },
    { status: 409, body: { error: "unrecognised conflict" }, kind: "uncertain" },
    { status: 500, body: { error: "private detail" }, kind: "uncertain" },
    { status: 201, body: { plan: null }, kind: "uncertain" },
    { status: 201, body: { plan: { ...plan, targetCalories: "invalid" } }, kind: "uncertain" },
  ])("classifies a $status write response as $kind", async ({ status, body, kind }) => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json(body, { status }));
    await expect(createNutritionPlan(new AbortController().signal, request)).rejects.toMatchObject({ kind });
  });
});
