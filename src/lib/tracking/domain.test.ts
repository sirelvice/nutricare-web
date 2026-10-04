import { describe, expect, it } from "vitest";
import { validateWeightEntry } from "./domain";

describe("validateWeightEntry", () => {
  it("accepts a valid weight entry", () => {
    expect(
      validateWeightEntry({
        date: "2026-09-02",
        weightKg: 60.5,
        note: "Morning weight",
      }),
    ).toBe(true);
  });

  it("accepts an entry without a note", () => {
    expect(
      validateWeightEntry({
        date: "2026-09-02",
        weightKg: 60,
      }),
    ).toBe(true);
  });

  it("rejects weight below the allowed range", () => {
    expect(
      validateWeightEntry({
        date: "2026-09-02",
        weightKg: 19.9,
      }),
    ).toBe(false);
  });

  it("rejects weight above the allowed range", () => {
    expect(
      validateWeightEntry({
        date: "2026-09-02",
        weightKg: 350.1,
      }),
    ).toBe(false);
  });

  it("rejects non-finite weight", () => {
    expect(
      validateWeightEntry({
        date: "2026-09-02",
        weightKg: Number.NaN,
      }),
    ).toBe(false);
  });

  it("rejects an invalid date format", () => {
    expect(
      validateWeightEntry({
        date: "02-09-2026",
        weightKg: 60,
      }),
    ).toBe(false);
  });

  it("rejects an invalid calendar date", () => {
    expect(
      validateWeightEntry({
        date: "2026-02-30",
        weightKg: 60,
      }),
    ).toBe(false);
  });

  it("rejects an overly long note", () => {
    expect(
      validateWeightEntry({
        date: "2026-09-02",
        weightKg: 60,
        note: "a".repeat(501),
      }),
    ).toBe(false);
  });
});
