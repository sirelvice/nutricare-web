import { describe, expect, it } from "vitest";
import { getGoalChangeFeedback, goalChangeFeedback } from "./goal-change-errors";

describe("goal change public feedback", () => {
  it.each(Object.entries(goalChangeFeedback))("uses fixed feedback for %s", (code, feedback) => {
    expect(getGoalChangeFeedback(feedback.status, { code, error: "Private database detail" }))
      .toEqual({ code, ...feedback });
  });
  it.each([null, {}, { code: "UNKNOWN" }, { code: "toString" }, { code: 123 }])("ignores unsupported payloads: %j", (payload) => {
    expect(getGoalChangeFeedback(422, payload)).toBeNull();
  });
  it("rejects a known code with an unexpected HTTP status", () => {
    expect(getGoalChangeFeedback(500, { code: "GOAL_CHANGE_WEIGHT_REQUIRED" })).toBeNull();
    expect(getGoalChangeFeedback(422, { code: "GOAL_CHANGE_CONFLICT" })).toBeNull();
  });
});
