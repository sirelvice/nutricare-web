import { describe, expect, it } from "vitest";
import {
  activityMultiplier,
  calcBMR,
  calcTDEE,
  goalCalories,
} from "../metabolism";

describe("calcBMR", () => {
  const base = {
    weightKg: 60,
    heightCm: 170,
    ageYears: 30,
  };

  it("calculates BMR for male", () => {
    expect(calcBMR({ ...base, gender: "male" })).toBe(1518);
  });

  it("calculates BMR for female", () => {
    expect(calcBMR({ ...base, gender: "female" })).toBe(1352);
  });

  it("calculates BMR for other gender", () => {
    expect(calcBMR({ ...base, gender: "other" })).toBe(1435);
  });

  it("returns null for invalid values", () => {
    expect(calcBMR({ ...base, weightKg: 0, gender: "male" })).toBeNull();
    expect(calcBMR({ ...base, heightCm: 0, gender: "male" })).toBeNull();
    expect(calcBMR({ ...base, ageYears: 0, gender: "male" })).toBeNull();
  });

  it("returns null for non-finite values", () => {
    expect(calcBMR({ ...base, weightKg: Infinity, gender: "male" })).toBeNull();
  });
});

describe("activityMultiplier", () => {
  it("returns the expected multiplier for each activity level", () => {
    expect(activityMultiplier("sedentary")).toBe(1.2);
    expect(activityMultiplier("light")).toBe(1.375);
    expect(activityMultiplier("moderate")).toBe(1.55);
    expect(activityMultiplier("active")).toBe(1.725);
    expect(activityMultiplier("very_active")).toBe(1.9);
  });
});

describe("calcTDEE", () => {
  it("calculates and rounds TDEE", () => {
    expect(calcTDEE({ bmr: 1518, activity: "moderate" })).toBe(2353);
  });
});

describe("goalCalories", () => {
  it("subtracts 300 calories for weight loss", () => {
    expect(goalCalories({ tdee: 2353, goal: "lose" })).toBe(2053);
  });

  it("adds 250 calories for weight gain", () => {
    expect(goalCalories({ tdee: 2353, goal: "gain" })).toBe(2603);
  });

  it("keeps TDEE for maintenance", () => {
    expect(goalCalories({ tdee: 2353, goal: "maintain" })).toBe(2353);
  });

  it("does not set weight-loss calories below 1200", () => {
    expect(goalCalories({ tdee: 1300, goal: "lose" })).toBe(1200);
  });
});
