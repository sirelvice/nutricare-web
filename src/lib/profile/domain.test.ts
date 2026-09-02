import { describe, expect, it } from "vitest";
import { validateProfile, type UserProfile } from "./domain";

const validProfile: UserProfile = {
  heightCm: 170,
  gender: "male",
  age: 30,
  activity: "moderate",
  goal: "maintain",
};

describe("validateProfile", () => {
  it("accepts a valid profile", () => {
    expect(validateProfile(validProfile)).toBe(true);
  });

  it("allows missing height", () => {
    expect(validateProfile({ ...validProfile, heightCm: null })).toBe(true);
  });

  it("allows missing age", () => {
    expect(validateProfile({ ...validProfile, age: null })).toBe(true);
  });

  it("rejects height below 80 cm", () => {
    expect(validateProfile({ ...validProfile, heightCm: 79 })).toBe(false);
  });

  it("rejects height above 250 cm", () => {
    expect(validateProfile({ ...validProfile, heightCm: 251 })).toBe(false);
  });

  it("rejects age below 10", () => {
    expect(validateProfile({ ...validProfile, age: 9 })).toBe(false);
  });

  it("rejects age above 120", () => {
    expect(validateProfile({ ...validProfile, age: 121 })).toBe(false);
  });
});
