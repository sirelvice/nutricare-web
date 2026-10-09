import { describe, expect, it } from "vitest";
import { profileSchema } from "./schema";
import { validateProfile, type UserProfile } from "./domain";

const profile: UserProfile = {
  heightCm: 175,
  age: 30,
  gender: "male",
  activity: "moderate",
  goal: "maintain",
};

describe("profile validation contract", () => {
  it.each([
    profile,
    { ...profile, heightCm: null, age: null },
    { ...profile, heightCm: 80, age: 10 },
    { ...profile, heightCm: 250, age: 120 },
    { ...profile, heightCm: 175.5 },
  ])("accepts supported profile data: %j", (value) => {
    expect(profileSchema.safeParse(value).success).toBe(true);
    expect(validateProfile(value)).toBe(true);
  });

  it.each([
    { ...profile, heightCm: 79 },
    { ...profile, heightCm: 251 },
    { ...profile, heightCm: Number.NaN },
    { ...profile, heightCm: Number.POSITIVE_INFINITY },
    { ...profile, heightCm: "175" },
    { ...profile, age: 9 },
    { ...profile, age: 121 },
    { ...profile, age: 30.5 },
    { ...profile, age: Number.NaN },
    { ...profile, age: "30" },
    { ...profile, gender: "unsupported" },
    { ...profile, activity: "unsupported" },
    { ...profile, goal: "unsupported" },
    { ...profile, goal: null },
    {},
    null,
  ])("rejects invalid runtime data at both boundaries: %j", (value) => {
    expect(profileSchema.safeParse(value).success).toBe(false);
    expect(validateProfile(value as UserProfile)).toBe(false);
  });
});
