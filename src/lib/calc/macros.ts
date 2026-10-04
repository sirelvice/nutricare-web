import type { Goal } from "@/lib/profile/domain";

export function calcMacros(targetCalories: number, goal: Goal) {
  const proteinPct = goal === "lose" ? 0.3 : 0.25;
  const fatPct = 0.25;
  const carbsPct = 1 - proteinPct - fatPct;

  return {
    proteinG: Math.round((targetCalories * proteinPct) / 4),
    carbsG: Math.round((targetCalories * carbsPct) / 4),
    fatG: Math.round((targetCalories * fatPct) / 9),
  };
}
