import { describe, expect, it } from "vitest";
import { parseWeightDraft } from "./weight-form";

describe("weight draft validation", () => {
  it("accepts a valid decimal measurement and trims the optional note", () => {
    expect(parseWeightDraft("2026-10-07", " 72.5 ", " Morning ")).toEqual({ date: "2026-10-07", weightKg: 72.5, note: "Morning" });
  });
  it.each(["", "0", "19.9", "351", "NaN", "Infinity", "7e1", "0x46", "70,5"])("rejects invalid or ambiguous weight text: %s", (weight) => {
    expect(parseWeightDraft("2026-10-07", weight, "")).toBeNull();
  });
  it("rejects impossible dates and excessive notes", () => {
    expect(parseWeightDraft("2026-02-30", "72.5", "")).toBeNull();
    expect(parseWeightDraft("2026-10-07", "72.5", "x".repeat(501))).toBeNull();
  });
});
