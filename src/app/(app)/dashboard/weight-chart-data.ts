import { validateWeightEntry, type WeightEntry } from "@/lib/tracking/domain";

export type WeightChartPeriod = "30" | "90" | "all";
export type WeightChartPoint = {
  date: string;
  timestamp: number;
  average: number;
  trend: number;
  count: number;
  minimum: number;
  maximum: number;
};
const DAY = 86_400_000;

export function buildWeightChartData(entries: WeightEntry[], period: WeightChartPeriod = "all") {
  const groups = new Map<string, { total: number; count: number; minimum: number; maximum: number }>();
  const ids = new Set<string>();
  for (const entry of entries) {
    if (!entry.id || ids.has(entry.id) || !validateWeightEntry(entry)) continue;
    ids.add(entry.id);
    const group = groups.get(entry.date);
    if (group) {
      group.total += entry.weightKg; group.count++;
      group.minimum = Math.min(group.minimum, entry.weightKg);
      group.maximum = Math.max(group.maximum, entry.weightKg);
    } else groups.set(entry.date, { total: entry.weightKg, count: 1, minimum: entry.weightKg, maximum: entry.weightKg });
  }
  const points = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, group]) => ({
    date, timestamp: Date.parse(`${date}T00:00:00Z`), average: group.total / group.count,
    count: group.count, minimum: group.minimum, maximum: group.maximum,
  }));
  // A rolling seven-calendar-day mean of daily means. Each recorded day has
  // equal influence; unrecorded days are not invented or treated as zero.
  let start = 0;
  let sum = 0;
  const all: WeightChartPoint[] = points.map((point, index) => {
    sum += point.average;
    while (points[start].timestamp < point.timestamp - 6 * DAY) {
      sum -= points[start++].average;
    }
    return { ...point, trend: sum / (index - start + 1) };
  });
  const last = all[all.length - 1];
  // Range controls are anchored to the latest measurement, not the wall clock,
  // so an older history remains visible and accurately labelled.
  const cutoff = last && period !== "all" ? last.timestamp - (Number(period) - 1) * DAY : -Infinity;
  const visible = all.filter((point) => point.timestamp >= cutoff);
  const bounds = visible.reduce((range, point) => ({
    low: Math.min(range.low, point.average, point.trend),
    high: Math.max(range.high, point.average, point.trend),
  }), { low: Infinity, high: -Infinity });
  const low = visible.length ? bounds.low : 0;
  const high = visible.length ? bounds.high : 1;
  const padding = Math.max(1, (high - low) * 0.15);
  return {
    points: visible,
    measurements: visible.reduce((count, point) => count + point.count, 0),
    domain: [Math.max(0, Math.floor(low - padding)), Math.ceil(high + padding)] as [number, number],
  };
}
