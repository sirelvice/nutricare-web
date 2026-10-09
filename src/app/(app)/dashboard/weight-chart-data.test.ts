import { describe, expect, it } from "vitest";
import { buildWeightChartData } from "./weight-chart-data";
import type { WeightEntry } from "@/lib/tracking/domain";

const entry = (id: string, date: string, weightKg: number): WeightEntry => ({ id, date, weightKg });
describe("weight chart history", () => {
  it("keeps all 100 distinct recorded days and sorts them chronologically", () => {
    const entries = Array.from({ length: 100 }, (_, index) => entry(`entry-${index}`,
      new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10), 70 + index / 10));
    const result = buildWeightChartData(entries.reverse());
    expect(result.points).toHaveLength(100);
    expect(result.measurements).toBe(100);
    expect(result.points[0].date).toBe("2026-01-01");
    expect(result.points[99].date).toBe("2026-04-10");
    expect(result.points.every((point) => Number.isFinite(point.average) && Number.isFinite(point.trend))).toBe(true);
  });
  it("groups repeated dates without dropping individual measurement counts or ranges", () => {
    const result = buildWeightChartData([entry("a", "2026-10-07", 60), entry("b", "2026-10-07", 80)]);
    expect(result.points).toHaveLength(1);
    expect(result.points[0]).toMatchObject({ average: 70, trend: 70, minimum: 60, maximum: 80, count: 2 });
    expect(result.measurements).toBe(2);
  });
  it("averages recorded daily means in a seven-calendar-day window", () => {
    const result = buildWeightChartData([
      entry("a", "2026-10-01", 50), entry("b", "2026-10-02", 60),
      entry("c", "2026-10-07", 80), entry("d", "2026-10-08", 90),
    ]);
    expect(result.points[2].trend).toBeCloseTo((50 + 60 + 80) / 3);
    expect(result.points[3].trend).toBeCloseTo((60 + 80 + 90) / 3);
  });
  it("does not turn missing days into zero-weight observations", () => {
    const result = buildWeightChartData([entry("a", "2026-01-01", 60), entry("b", "2026-02-01", 80)]);
    expect(result.points.map((point) => point.trend)).toEqual([60, 80]);
  });
  it("preserves trend context before applying the selected visible period", () => {
    const entries = Array.from({ length: 100 }, (_, index) => entry(`entry-${index}`,
      new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10), 60 + index));
    const all = buildWeightChartData(entries);
    const recent = buildWeightChartData(entries, "30");
    expect(recent.points).toHaveLength(30);
    expect(recent.points[0].trend).toBe(all.points[70].trend);
  });
  it("supports 100 same-day measurements as one meaningful daily point", () => {
    const result = buildWeightChartData(Array.from({ length: 100 }, (_, index) => entry(`entry-${index}`, "2026-10-07", 60 + index % 2)));
    expect(result.points).toHaveLength(1);
    expect(result.points[0].average).toBe(60.5);
    expect(result.measurements).toBe(100);
    expect(result.domain[0]).toBeLessThan(60.5);
    expect(result.domain[1]).toBeGreaterThan(60.5);
  });
  it("keeps a usable vertical range for flat histories", () => {
    const result = buildWeightChartData([entry("a", "2026-10-01", 70), entry("b", "2026-10-02", 70)]);
    expect(result.domain).toEqual([69, 71]);
  });
  it("ignores duplicate IDs and invalid measurements without mutating input", () => {
    const entries = [entry("a", "2026-10-07", 70), entry("a", "2026-10-07", 70), entry("b", "2026-02-30", 80), entry("c", "2026-10-08", NaN)];
    const copy = [...entries];
    expect(buildWeightChartData(entries).measurements).toBe(1);
    expect(entries).toEqual(copy);
  });
  it("handles an empty history", () => {
    expect(buildWeightChartData([]).points).toEqual([]);
  });
});
