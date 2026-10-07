import { describe, expect, it, vi } from "vitest";
import { assertPlanAge, parsePlanEligibilityCode } from "./eligibility";
import { createNutritionPlan, readNutritionPlan } from "./client";

describe("planning eligibility", () => {
  it.each([null, NaN, 19.5, 121])("requires a valid age for %s", (age) => {
    expect(() => assertPlanAge(age)).toThrow("Add a valid age");
  });
  it.each([10, 19])("does not prescribe adult targets for age %s", (age) => {
    expect(() => assertPlanAge(age)).toThrow("20 and over");
  });
  it.each([20, 120])("supports age %s", (age) => expect(() => assertPlanAge(age)).not.toThrow());
  it("does not accept an unknown eligibility code", () => expect(parsePlanEligibilityCode({ code: "UNKNOWN" })).toBeNull());
  it.each(["NUTRITION_PLAN_AGE_REQUIRED", "NUTRITION_PLAN_AGE_UNSUPPORTED"])("classifies %s on reads and writes", async (code) => {
    const kind = code.endsWith("UNSUPPORTED") ? "age-unsupported" : "age-required";
    for (const requestPlan of [readNutritionPlan, createNutritionPlan]) {
      const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ code, error: "untrusted text" }, { status: 422 }));
      await expect(requestPlan(new AbortController().signal, request)).rejects.toMatchObject({ kind });
    }
  });
});
