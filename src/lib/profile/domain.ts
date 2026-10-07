import { profileSchema } from "./schema";
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
  return profileSchema.safeParse(profile).success;
}
