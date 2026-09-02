import type { ActivityLevel, Gender } from "@/lib/calc/metabolism";

export type Goal = "lose" | "maintain" | "gain";

export type UserProfile = {
  heightCm: number | null;
  gender: Gender;
  age: number | null;
  activity: ActivityLevel;
  goal: Goal;
};

export function validateProfile(profile: UserProfile): boolean {
  const heightValid =
    profile.heightCm === null ||
    (profile.heightCm >= 80 && profile.heightCm <= 250);

  const ageValid =
    profile.age === null ||
    (profile.age >= 10 && profile.age <= 120);

  return heightValid && ageValid;
}
