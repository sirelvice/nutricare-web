import { describe, expect, it } from "vitest";
import {
  validateNutritionPlan,
  type NewNutritionPlan,
} from "@/lib/nutrition-plan/domain";

const validPlan: NewNutritionPlan = {
  version: 1,
  goal: "lose",
  targetCalories: 2000,
  proteinG: 150,
  carbsG: 225,
  fatG: 56,
};

describe("validateNutritionPlan", () => {
  it("accepts a valid plan", () => {
    expect(validateNutritionPlan(validPlan)).toBe(true);
  });

  it("rejects invalid versions", () => {
    expect(validateNutritionPlan({ ...validPlan, version: 0 })).toBe(false);
    expect(validateNutritionPlan({ ...validPlan, version: 1.5 })).toBe(false);
  });

  it("rejects non-positive calories", () => {
    expect(
      validateNutritionPlan({ ...validPlan, targetCalories: 0 })
    ).toBe(false);
  });

  it("rejects negative macro values", () => {
    expect(
      validateNutritionPlan({ ...validPlan, proteinG: -1 })
    ).toBe(false);
  });
});
