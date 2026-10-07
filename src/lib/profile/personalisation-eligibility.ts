// Product scope shared by personalised recommendations and nutrition planning.
// This product does not implement age-specific nutrition calculations for under-20s.
export function getPersonalisationAgeStatus(age: number | null) {
  if (age === null || !Number.isInteger(age) || age < 10 || age > 120) return "age-required" as const;
  return age < 20 ? "age-unsupported" as const : "ready" as const;
}
