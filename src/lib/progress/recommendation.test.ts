import { describe, expect, it } from "vitest";
import {
  recommendAdjustment,
  type EvaluationSnapshot,
  type PreviousPlanContext,
} from "./recommendation";

function evaluation(
  state: EvaluationSnapshot["state"],
  planVersionId: string,
  evaluatedAt: string,
): EvaluationSnapshot {
  return { state, planVersionId, evaluatedAt };
}

function previousPlan(
  planVersionId: string,
  finalProblemState: PreviousPlanContext["finalProblemState"],
  wasAdjustment = false,
): PreviousPlanContext {
  return {
    planVersionId,
    finalProblemState,
    wasAdjustment,
  };
}

describe("recommendAdjustment", () => {
  it("continues when there is insufficient data", () => {
    expect(
      recommendAdjustment({
        currentEvaluation: evaluation("INSUFFICIENT_DATA", "p1", "2026-09-15"),
        evaluationHistory: [],
        previousPlanContext: null,
      }),
    ).toEqual({
      recommendedAction: "CONTINUE",
      reason: "insufficient_data",
    });
  });

  it("continues when on track", () => {
    expect(
      recommendAdjustment({
        currentEvaluation: evaluation("ON_TRACK", "p1", "2026-09-15"),
        evaluationHistory: [],
        previousPlanContext: null,
      }),
    ).toEqual({
      recommendedAction: "CONTINUE",
      reason: "on_track",
    });
  });

  it("reviews adherence for the first plateau", () => {
    expect(
      recommendAdjustment({
        currentEvaluation: evaluation("PLATEAU", "p1", "2026-09-15"),
        evaluationHistory: [],
        previousPlanContext: null,
      }),
    ).toEqual({
      recommendedAction: "REVIEW_ADHERENCE",
      reason: "first_problem",
    });
  });

  it("reviews adherence for the first behind-opposite evaluation", () => {
    expect(
      recommendAdjustment({
        currentEvaluation: evaluation(
          "BEHIND_OPPOSITE",
          "p1",
          "2026-09-15",
        ),
        evaluationHistory: [],
        previousPlanContext: null,
      }),
    ).toEqual({
      recommendedAction: "REVIEW_ADHERENCE",
      reason: "first_problem",
    });
  });

  it("considers an adjustment after two consecutive plateau evaluations", () => {
    expect(
      recommendAdjustment({
        currentEvaluation: evaluation("PLATEAU", "p1", "2026-09-29"),
        evaluationHistory: [
          evaluation("PLATEAU", "p1", "2026-09-15"),
        ],
        previousPlanContext: null,
      }),
    ).toEqual({
      recommendedAction: "CONSIDER_ADJUSTMENT",
      reason: "consecutive_problem",
    });
  });

  it("considers an adjustment after two consecutive behind-opposite evaluations", () => {
    expect(
      recommendAdjustment({
        currentEvaluation: evaluation(
          "BEHIND_OPPOSITE",
          "p1",
          "2026-09-29",
        ),
        evaluationHistory: [
          evaluation("BEHIND_OPPOSITE", "p1", "2026-09-15"),
        ],
        previousPlanContext: null,
      }),
    ).toEqual({
      recommendedAction: "CONSIDER_ADJUSTMENT",
      reason: "consecutive_problem",
    });
  });

  it("treats mixed problem states as consecutive", () => {
    expect(
      recommendAdjustment({
        currentEvaluation: evaluation(
          "BEHIND_OPPOSITE",
          "p1",
          "2026-09-29",
        ),
        evaluationHistory: [
          evaluation("PLATEAU", "p1", "2026-09-15"),
        ],
        previousPlanContext: null,
      }),
    ).toEqual({
      recommendedAction: "CONSIDER_ADJUSTMENT",
      reason: "consecutive_problem",
    });
  });

  it("does not count non-consecutive problem evaluations as a streak", () => {
    expect(
      recommendAdjustment({
        currentEvaluation: evaluation("PLATEAU", "p1", "2026-09-29"),
        evaluationHistory: [
          evaluation("PLATEAU", "p1", "2026-09-15"),
          evaluation("ON_TRACK", "p1", "2026-09-22"),
        ],
        previousPlanContext: null,
      }),
    ).toEqual({
      recommendedAction: "REVIEW_ADHERENCE",
      reason: "first_problem",
    });
  });

  it("does not carry a streak across plan boundaries", () => {
    expect(
      recommendAdjustment({
        currentEvaluation: evaluation("PLATEAU", "p2", "2026-10-13"),
        evaluationHistory: [
          evaluation("PLATEAU", "p1", "2026-09-29"),
        ],
        previousPlanContext: previousPlan("p1", "PLATEAU", false),
      }),
    ).toEqual({
      recommendedAction: "REVIEW_ADHERENCE",
      reason: "first_problem",
    });
  });

  it("does not treat a continuing plateau as recurrence without an adjustment", () => {
    expect(
      recommendAdjustment({
        currentEvaluation: evaluation("PLATEAU", "p2", "2026-10-13"),
        evaluationHistory: [
          evaluation("PLATEAU", "p1", "2026-09-29"),
        ],
        previousPlanContext: previousPlan("p1", "PLATEAU", false),
      }),
    ).toEqual({
      recommendedAction: "REVIEW_ADHERENCE",
      reason: "first_problem",
    });
  });

  it("does not treat a new plan as recurrence when its previous plan ended on track", () => {
    expect(
      recommendAdjustment({
        currentEvaluation: evaluation("PLATEAU", "p2", "2026-10-13"),
        evaluationHistory: [],
        previousPlanContext: previousPlan("p1", null, true),
      }),
    ).toEqual({
      recommendedAction: "REVIEW_ADHERENCE",
      reason: "first_problem",
    });
  });

  it("suggests professional consultation when a problem recurs immediately after an adjustment", () => {
    expect(
      recommendAdjustment({
        currentEvaluation: evaluation("PLATEAU", "p2", "2026-10-13"),
        evaluationHistory: [],
        previousPlanContext: previousPlan("p1", "PLATEAU", true),
      }),
    ).toEqual({
      recommendedAction: "SUGGEST_PROFESSIONAL_CONSULT",
      reason: "recurrence_after_adjustment",
    });
  });

  it("escalates a different problem state when it recurs after an adjustment", () => {
    expect(
      recommendAdjustment({
        currentEvaluation: evaluation(
          "BEHIND_OPPOSITE",
          "p2",
          "2026-10-13",
        ),
        evaluationHistory: [],
        previousPlanContext: previousPlan("p1", "PLATEAU", true),
      }),
    ).toEqual({
      recommendedAction: "SUGGEST_PROFESSIONAL_CONSULT",
      reason: "recurrence_after_adjustment",
    });
  });

  it("does not treat a problem in p1 as an immediate recurrence in p3", () => {
    expect(
      recommendAdjustment({
        currentEvaluation: evaluation("PLATEAU", "p3", "2026-10-27"),
        evaluationHistory: [],
        previousPlanContext: previousPlan("p2", null, true),
      }),
    ).toEqual({
      recommendedAction: "REVIEW_ADHERENCE",
      reason: "first_problem",
    });
  });

  it("does not count the current evaluation twice when history contains only prior evaluations", () => {
    expect(
      recommendAdjustment({
        currentEvaluation: evaluation("PLATEAU", "p1", "2026-09-29"),
        evaluationHistory: [
          evaluation("PLATEAU", "p1", "2026-09-15"),
        ],
        previousPlanContext: null,
      }),
    ).toEqual({
      recommendedAction: "CONSIDER_ADJUSTMENT",
      reason: "consecutive_problem",
    });
  });

  it("uses chronological order when prior history is newest first", () => {
    expect(
      recommendAdjustment({
        currentEvaluation: evaluation("PLATEAU", "p1", "2026-09-29"),
        evaluationHistory: [
          evaluation("ON_TRACK", "p1", "2026-09-22"),
          evaluation("PLATEAU", "p1", "2026-09-15"),
        ],
        previousPlanContext: null,
      }),
    ).toEqual({
      recommendedAction: "REVIEW_ADHERENCE",
      reason: "first_problem",
    });
  });
});
