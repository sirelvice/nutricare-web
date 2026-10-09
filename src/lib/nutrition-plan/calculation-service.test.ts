import { describe, expect, it } from "vitest";
import { calculateNutritionPlan } from "@/lib/nutrition-plan/calculation-service";
import type { UserProfile } from "@/lib/profile/domain";

const profile: UserProfile = {
  heightCm: 170,
  age: 30,
  gender: "male",
  activity: "moderate",
  goal: "lose",
};

describe("calculateNutritionPlan", () => {
  it("calculates a plan from profile and weight", () => {
    const result = calculateNutritionPlan({
      profile,
      weightKg: 60,
    });

    expect(result).toEqual({
      goal: "lose",
      targetCalories: 2053,
      proteinG: 154,
      carbsG: 231,
      fatG: 57,
    });
  });

  it("returns null when height is missing", () => {
    const result = calculateNutritionPlan({
      profile: { ...profile, heightCm: null },
      weightKg: 60,
    });

    expect(result).toBeNull();
  });

  it("returns null when age is missing", () => {
    const result = calculateNutritionPlan({
      profile: { ...profile, age: null },
      weightKg: 60,
    });

    expect(result).toBeNull();
  });
});

it.each([10, 19, 19.5, 121, NaN])("does not calculate personalised targets for age %s", (age) => {
  expect(calculateNutritionPlan({ profile: { ...profile, age }, weightKg: 60 })).toBeNull();
});
it("supports the product age boundary of 20", () => {
  expect(calculateNutritionPlan({ profile: { ...profile, age: 20 }, weightKg: 60 })).not.toBeNull();
});
