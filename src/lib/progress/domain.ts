import type { Goal } from "@/lib/profile/domain";
import type { WeightEntry } from "@/lib/tracking/domain";

export type ProgressState =
  | "ON_TRACK"
  | "BEHIND_OPPOSITE"
  | "PLATEAU"
  | "INSUFFICIENT_DATA";

export type ProgressEvaluation = {
  state: ProgressState;
  changeKg: number | null;
  entriesCount: number;
  evaluationDays: number | null;
};

function daysBetween(startDate: string, endDate: string): number | null {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null;
  }

  return Math.floor((end - start) / (24 * 60 * 60 * 1000));
}

export function evaluateProgress(params: {
  goal: Goal;
  entries: WeightEntry[];
  minimumEntries?: number;
  minimumChangeKg?: number;
  minimumDays?: number;
}): ProgressEvaluation {
  const {
    goal,
    entries,
    minimumEntries = 3,
    minimumChangeKg = 0.5,
    minimumDays = 14,
  } = params;

  if (entries.length < minimumEntries) {
    return {
      state: "INSUFFICIENT_DATA",
      changeKg: null,
      entriesCount: entries.length,
      evaluationDays: null,
    };
  }

  const sorted = [...entries].sort((a, b) =>
    a.date > b.date ? 1 : -1,
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const evaluationDays = daysBetween(first.date, last.date);

  if (evaluationDays === null || evaluationDays < minimumDays) {
    return {
      state: "INSUFFICIENT_DATA",
      changeKg: null,
      entriesCount: entries.length,
      evaluationDays,
    };
  }

  const changeKg = Number((last.weightKg - first.weightKg).toFixed(1));

  if (goal === "maintain") {
    return {
      state:
        Math.abs(changeKg) <= minimumChangeKg
          ? "ON_TRACK"
          : "BEHIND_OPPOSITE",
      changeKg,
      entriesCount: entries.length,
      evaluationDays,
    };
  }

  const movingInExpectedDirection =
    goal === "lose"
      ? changeKg <= -minimumChangeKg
      : changeKg >= minimumChangeKg;

  const movingInOppositeDirection =
    goal === "lose"
      ? changeKg >= minimumChangeKg
      : changeKg <= -minimumChangeKg;

  return {
    state: movingInExpectedDirection
      ? "ON_TRACK"
      : movingInOppositeDirection
        ? "BEHIND_OPPOSITE"
        : "PLATEAU",
    changeKg,
    entriesCount: entries.length,
    evaluationDays,
  };
}
