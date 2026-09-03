import { describe, expect, it } from "vitest";
import { getNutritionRecommendations } from "../nutrition";

describe("getNutritionRecommendations", () => {
  it("returns goal-specific recommendations for weight loss", () => {
    const result = getNutritionRecommendations({
      bmi: 27,
      bmiLabel: "Overweight",
      goal: "lose",
    });

    expect(result.goal).toBe("lose");
    expect(result.focus[0]).toContain("mild deficit");
  });

  it("returns goal-specific recommendations for weight gain", () => {
    const result = getNutritionRecommendations({
      bmi: 17,
      bmiLabel: "Underweight",
      goal: "gain",
    });

    expect(result.goal).toBe("gain");
    expect(result.focus[0]).toContain("extra snack");
  });

  it("returns recommendations for maintenance", () => {
    const result = getNutritionRecommendations({
      bmi: 22,
      bmiLabel: "Normal",
      goal: "maintain",
    });

    expect(result.goal).toBe("maintain");
    expect(result.summary).toContain("balanced pattern");
  });
});
