export const goalChangeFeedback = {
  GOAL_CHANGE_WEIGHT_REQUIRED: {
    status: 422,
    message: "Record your weight before changing your saved goal. Your profile has not been changed.",
  },
  GOAL_CHANGE_PLAN_UNAVAILABLE: {
    status: 422,
    message: "A new plan could not be calculated. Add valid height, age and a recorded weight before changing your saved goal.",
  },
  GOAL_CHANGE_CONFLICT: {
    status: 409,
    message: "Your goal or nutrition plan changed while this request was being processed. Reload your saved profile before trying again.",
  },
} as const;

export type GoalChangeErrorCode = keyof typeof goalChangeFeedback;

export class GoalChangeError extends Error {
  constructor(public readonly code: GoalChangeErrorCode, message: string) {
    super(message);
    this.name = "GoalChangeError";
  }
}

// Only allow known codes paired with their expected HTTP status. Never show
// arbitrary server messages or database errors to the user.
export function getGoalChangeFeedback(status: number, payload: unknown) {
  if (!payload || typeof payload !== "object" || !("code" in payload)) return null;
  const code = payload.code;
  if (typeof code !== "string" || !Object.prototype.hasOwnProperty.call(goalChangeFeedback, code)) return null;
  const knownCode = code as GoalChangeErrorCode;
  const feedback = goalChangeFeedback[knownCode];
  return feedback.status === status ? { code: knownCode, ...feedback } : null;
}
