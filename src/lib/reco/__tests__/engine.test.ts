import { describe, expect, it } from "vitest";
import { buildRecommendations } from "../engine";

const base = {
  bmi: 22,
  category: "normal" as const,
  targetCalories: 2000,
};

describe("buildRecommendations", () => {
  it("returns the expected macro targets for maintenance", () => {
    const result = buildRecommendations({
      ...base,
      goal: "maintain",
    });

    expect(result.macros).toEqual({
      proteinG: 125,
      carbsG: 250,
      fatG: 56,
    });
  });

  it("uses higher protein allocation for weight loss", () => {
    const result = buildRecommendations({
      ...base,
      goal: "lose",
    });

    expect(result.macros).toEqual({
      proteinG: 150,
      carbsG: 225,
      fatG: 56,
    });
  });

  it("returns the expected macro targets for weight gain", () => {
    const result = buildRecommendations({
      ...base,
      goal: "gain",
    });

    expect(result.macros).toEqual({
      proteinG: 125,
      carbsG: 250,
      fatG: 56,
    });
  });

  it("includes the BMI in the summary", () => {
    const result = buildRecommendations({
      ...base,
      bmi: 27.3,
      category: "overweight",
      goal: "lose",
    });

    expect(result.summary).toContain("27.3");
  });

  it("provides guidance for each BMI category", () => {
    const underweight = buildRecommendations({
      ...base,
      category: "underweight",
      goal: "gain",
    });

    const normal = buildRecommendations({
      ...base,
      category: "normal",
      goal: "maintain",
    });

    const overweight = buildRecommendations({
      ...base,
      category: "overweight",
      goal: "lose",
    });

    const obese = buildRecommendations({
      ...base,
      category: "obese",
      goal: "lose",
    });

    expect(underweight.summary).toContain("underweight");
    expect(normal.summary).toContain("healthy range");
    expect(overweight.summary).toContain("overweight");
    expect(obese.summary).toContain("obesity");
  });

  it("adds goal-specific guidance for weight loss", () => {
    const result = buildRecommendations({
      ...base,
      goal: "lose",
    });

    expect(result.nextSteps[0]).toContain("target calories");
  });

  it("adds goal-specific guidance for weight gain", () => {
    const result = buildRecommendations({
      ...base,
      goal: "gain",
    });

    expect(result.nextSteps[0]).toContain("target calories");
    expect(result.nextSteps[0]).toContain("strength training");
  });

  it("adds goal-specific guidance for maintenance", () => {
    const result = buildRecommendations({
      ...base,
      goal: "maintain",
    });

    expect(result.nextSteps[0]).toContain("target calories");
  });

  it("returns the fields expected by the UI", () => {
    const result = buildRecommendations({
      ...base,
      goal: "maintain",
    });

    expect(result.focus.length).toBeGreaterThan(0);
    expect(result.limit.length).toBeGreaterThan(0);
    expect(result.mealIdeas.length).toBeGreaterThan(0);
    expect(result.priorities.length).toBeGreaterThan(0);
    expect(result.foodsToFocus.length).toBeGreaterThan(0);
    expect(result.foodsToLimit.length).toBeGreaterThan(0);
    expect(result.nextSteps.length).toBeGreaterThan(0);
  });
});
