import { describe, expect, it } from "vitest";
import { evaluateProgress } from "./domain";
import type { WeightEntry } from "@/lib/tracking/domain";

const entry = (id: string, date: string, weightKg: number): WeightEntry => ({
  id,
  date,
  weightKg,
});

describe("evaluateProgress", () => {
  it("returns insufficient data with fewer than 3 entries", () => {
    const result = evaluateProgress({
      goal: "lose",
      entries: [
        entry("1", "2026-08-01", 70),
        entry("2", "2026-08-08", 69.5),
      ],
    });

    expect(result).toEqual({
      state: "INSUFFICIENT_DATA",
      changeKg: null,
      entriesCount: 2,
      evaluationDays: null,
    });
  });

  it("returns insufficient data when 3 entries do not span 14 days", () => {
    const result = evaluateProgress({
      goal: "lose",
      entries: [
        entry("1", "2026-08-01", 70),
        entry("2", "2026-08-05", 69.5),
        entry("3", "2026-08-10", 69),
      ],
    });

    expect(result.state).toBe("INSUFFICIENT_DATA");
    expect(result.changeKg).toBeNull();
    expect(result.evaluationDays).toBe(9);
  });

  it("evaluates exactly 14 days of data", () => {
    const result = evaluateProgress({
      goal: "lose",
      entries: [
        entry("1", "2026-08-01", 70),
        entry("2", "2026-08-08", 69.8),
        entry("3", "2026-08-15", 69.4),
      ],
    });

    expect(result.state).toBe("ON_TRACK");
    expect(result.changeKg).toBe(-0.6);
    expect(result.evaluationDays).toBe(14);
  });

  it("recognizes expected weight loss", () => {
    const result = evaluateProgress({
      goal: "lose",
      entries: [
        entry("1", "2026-08-01", 70),
        entry("2", "2026-08-08", 69.7),
        entry("3", "2026-08-15", 69.4),
      ],
    });

    expect(result.state).toBe("ON_TRACK");
    expect(result.changeKg).toBe(-0.6);
  });

  it("recognizes expected weight gain", () => {
    const result = evaluateProgress({
      goal: "gain",
      entries: [
        entry("1", "2026-08-01", 60),
        entry("2", "2026-08-08", 60.3),
        entry("3", "2026-08-15", 60.6),
      ],
    });

    expect(result.state).toBe("ON_TRACK");
    expect(result.changeKg).toBe(0.6);
  });

  it("recognizes maintenance within the 0.5 kg tolerance", () => {
    const result = evaluateProgress({
      goal: "maintain",
      entries: [
        entry("1", "2026-08-01", 60),
        entry("2", "2026-08-08", 60.2),
        entry("3", "2026-08-15", 60.5),
      ],
    });

    expect(result.state).toBe("ON_TRACK");
    expect(result.changeKg).toBe(0.5);
  });

  it("recognizes weight loss as opposite movement for a gain goal", () => {
    const result = evaluateProgress({
      goal: "gain",
      entries: [
        entry("1", "2026-08-01", 60),
        entry("2", "2026-08-08", 59.8),
        entry("3", "2026-08-15", 59.4),
      ],
    });

    expect(result.state).toBe("BEHIND_OPPOSITE");
    expect(result.changeKg).toBe(-0.6);
  });

  it("recognizes weight gain as opposite movement for a loss goal", () => {
    const result = evaluateProgress({
      goal: "lose",
      entries: [
        entry("1", "2026-08-01", 70),
        entry("2", "2026-08-08", 70.2),
        entry("3", "2026-08-15", 70.6),
      ],
    });

    expect(result.state).toBe("BEHIND_OPPOSITE");
    expect(result.changeKg).toBe(0.6);
  });

  it("recognizes a plateau when movement is below the meaningful threshold", () => {
    const result = evaluateProgress({
      goal: "lose",
      entries: [
        entry("1", "2026-08-01", 70),
        entry("2", "2026-08-08", 69.9),
        entry("3", "2026-08-15", 69.7),
      ],
    });

    expect(result.state).toBe("PLATEAU");
    expect(result.changeKg).toBe(-0.3);
  });

  it("sorts entries before evaluating progress", () => {
    const result = evaluateProgress({
      goal: "lose",
      entries: [
        entry("3", "2026-08-15", 69.4),
        entry("1", "2026-08-01", 70),
        entry("2", "2026-08-08", 69.7),
      ],
    });

    expect(result.state).toBe("ON_TRACK");
    expect(result.changeKg).toBe(-0.6);
    expect(result.evaluationDays).toBe(14);
  });

  it("supports custom evaluation thresholds", () => {
    const result = evaluateProgress({
      goal: "lose",
      entries: [
        entry("1", "2026-08-01", 70),
        entry("2", "2026-08-04", 69.8),
        entry("3", "2026-08-08", 69.6),
      ],
      minimumDays: 7,
      minimumChangeKg: 0.3,
    });

    expect(result.state).toBe("ON_TRACK");
    expect(result.changeKg).toBe(-0.4);
    expect(result.evaluationDays).toBe(7);
  });
});
