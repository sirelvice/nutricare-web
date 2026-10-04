import { describe, expect, it } from "vitest";
import {
  describeProgressState,
  describeProgressSummary,
  describeRecommendation,
} from "./presentation";

describe("progress presentation", () => {
  it("uses goal-aware wording for on-track progress", () => {
    expect(describeProgressState("maintain", "ON_TRACK")).toBe(
      "Your weight is staying fairly steady",
    );

    expect(describeProgressState("lose", "ON_TRACK")).toBe(
      "You're moving toward your goal",
    );

    expect(describeProgressState("gain", "ON_TRACK")).toBe(
      "You're moving toward your goal",
    );
  });

  it("describes problem and insufficient-data states", () => {
    expect(describeProgressState("lose", "BEHIND_OPPOSITE")).toBe(
      "Your recent weight change is moving away from your goal",
    );

    expect(describeProgressState("gain", "PLATEAU")).toBe(
      "Your weight has changed very little so far",
    );

    expect(describeProgressState("maintain", "INSUFFICIENT_DATA")).toBe(
      "We need a little more history to understand your progress",
    );
  });

  it("describes progress change", () => {
    expect(describeProgressSummary("ON_TRACK", -1.2, 21)).toBe(
      "Your logged weight decreased by 1.2 kg over 21 days.",
    );

    expect(describeProgressSummary("ON_TRACK", 0, 14)).toBe(
      "Your logged weight stayed the same over 14 days.",
    );

    expect(describeProgressSummary("ON_TRACK", 1.1, 28)).toBe(
      "Your logged weight increased by 1.1 kg over 28 days.",
    );
  });

  it("uses evidence-first wording when data is insufficient", () => {
    expect(
      describeProgressSummary("INSUFFICIENT_DATA", null, null),
    ).toContain("Keep logging your weight consistently");

    expect(describeProgressSummary("ON_TRACK", null, null)).toBe(
      "We don't have enough information to describe the change yet.",
    );
  });

  it("maps recommendation decisions to user-facing guidance", () => {
    expect(
      describeRecommendation("CONTINUE", "insufficient_data"),
    ).toContain("Keep logging");

    expect(
      describeRecommendation("REVIEW_ADHERENCE", "first_problem"),
    ).toContain("Review how consistently");

    expect(
      describeRecommendation("CONSIDER_ADJUSTMENT", "consecutive_problem"),
    ).toContain("review and adjust");

    expect(
      describeRecommendation(
        "SUGGEST_PROFESSIONAL_CONSULT",
        "recurrence_after_adjustment",
      ),
    ).toContain("qualified health professional");
  });
});
