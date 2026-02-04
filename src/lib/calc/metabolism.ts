export type Gender = "male" | "female" | "other";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

/**
 * Mifflin–St Jeor (widely used BMR estimate).
 */
export function calcBMR(params: {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  gender: Gender;
}) {
  const { weightKg, heightCm, ageYears, gender } = params;

  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm) || !Number.isFinite(ageYears)) return null;
  if (weightKg <= 0 || heightCm <= 0 || ageYears <= 0) return null;

  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  const constant =
    gender === "male" ? 5 : gender === "female" ? -161 : (5 + -161) / 2;

  const bmr = base + constant;
  return Number.isFinite(bmr) ? Math.round(bmr) : null;
}

export function activityMultiplier(level: ActivityLevel) {
  switch (level) {
    case "sedentary":
      return 1.2;
    case "light":
      return 1.375;
    case "moderate":
      return 1.55;
    case "active":
      return 1.725;
    case "very_active":
      return 1.9;
    default:
      return 1.55;
  }
}

export function calcTDEE(params: { bmr: number; activity: ActivityLevel }) {
  const { bmr, activity } = params;
  const tdee = bmr * activityMultiplier(activity);
  return Number.isFinite(tdee) ? Math.round(tdee) : null;
}

/**
 * Safe-ish default adjustments (not extreme):
 * - lose: -300 kcal/day (floor 1200)
 * - gain: +250 kcal/day
 * - maintain: TDEE
 */
export function goalCalories(params: { tdee: number; goal: "lose" | "maintain" | "gain" }) {
  const { tdee, goal } = params;
  if (goal === "lose") return Math.max(1200, Math.round(tdee - 300));
  if (goal === "gain") return Math.round(tdee + 250);
  return Math.round(tdee);
}
