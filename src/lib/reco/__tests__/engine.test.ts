import { describe, expect, it } from "vitest";
import { buildRecommendations } from "../engine";

const base = {
  bmi: 22,
  category: "normal" as const,
};

describe("buildRecommendations", () => {
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


describe("consistent, explainable guidance", () => {
  it.each([
    ["underweight", "lose"], ["underweight", "maintain"],
    ["overweight", "gain"], ["obese", "gain"],
  ] as const)("prioritises a goal review for %s with %s", (category, goal) => {
    const result = buildRecommendations({ bmi: 22, category, goal });
    expect(result.guidanceMode).toBe("goal-review");
    expect(result.actions[0].id).toBe("review-goal");
    expect(result.actions[0].href).toBe("/profile");
    expect(result.nextSteps.join(" ")).not.toContain("target calories");
    expect(result.summary).toContain("before following weight-change targets");
    expect(result.warnings[0]).toContain("qualified health professional");
  });

  it.each([
    ["underweight", "gain"], ["normal", "lose"], ["normal", "gain"],
    ["normal", "maintain"], ["overweight", "lose"], ["overweight", "maintain"],
    ["obese", "lose"], ["obese", "maintain"],
  ] as const)("avoids additional calorie prescriptions for %s with %s", (category, goal) => {
    const result = buildRecommendations({ bmi: 22, category, goal });
    expect(result.guidanceMode).toBe("general");
    expect(result.actions[0].href).toBe("/tools/calories");
    expect(result.nextSteps.join(" ")).not.toMatch(/surplus|deficit|250|400/);
  });

  it("provides meal examples separately from actions and explains their limits", () => {
    const result = buildRecommendations({ ...base, goal: "maintain" });
    expect(result.mealIdeas).not.toEqual(result.nextSteps);
    expect(result.mealIdeas[0]).toContain("Beans");
    expect(result.mealIdeasNote).toContain("allergies");
    expect(result.mealIdeasNote).toContain("not been calculated");
    expect(result.actions.every((action) => action.reason.length > 0)).toBe(true);
    expect(result.sources.every((source) => new URL(source.url).hostname === "www.who.int")).toBe(true);
    expect(result.contentVersion).toBe("2026-10-07.1");
  });

  it.each([NaN, Infinity, 0, -1])("rejects an invalid BMI: %s", (bmi) => {
    expect(() => buildRecommendations({ ...base, bmi, goal: "maintain" })).toThrow("A valid BMI is required.");
  });
});
