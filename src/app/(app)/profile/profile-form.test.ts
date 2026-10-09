import { describe, expect, it } from "vitest";
import { emptyProfile, parseProfileDraft, toProfileDraft } from "./profile-form";

describe("profile form measurements", () => {
  it("keeps empty measurements nullable for partial setup", () => {
    expect(parseProfileDraft(toProfileDraft(emptyProfile))).toMatchObject({
      success: true, data: { heightCm: null, age: null },
    });
  });
  it("accepts decimal height, whole age, and surrounding whitespace", () => {
    expect(parseProfileDraft({ ...toProfileDraft(emptyProfile), heightCm: " 175.5 ", age: "30" }))
      .toMatchObject({ success: true, data: { heightCm: 175.5, age: 30 } });
  });
  it.each(["abc", "0xAF", "1e2", "175,5", "Infinity", "79", "251"])("rejects height %s", (heightCm) => {
    expect(parseProfileDraft({ ...toProfileDraft(emptyProfile), heightCm }).success).toBe(false);
  });
  it.each(["30.5", "9", "121", "NaN"])("rejects age %s", (age) => {
    expect(parseProfileDraft({ ...toProfileDraft(emptyProfile), age }).success).toBe(false);
  });
  it("round-trips a persisted profile without changing numeric precision", () => {
    const profile = { ...emptyProfile, heightCm: 175.25, age: 30 };
    expect(parseProfileDraft(toProfileDraft(profile))).toMatchObject({ success: true, data: profile });
  });
});
