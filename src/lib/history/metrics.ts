export type MetricKind = "bmi" | "calories";

export type MetricEntry =
  | { kind: "bmi"; date: string; bmi: number; heightCm: number; weightKg: number; category: string }
  | { kind: "calories"; date: string; bmr: number; tdee: number; targetCalories: number; goal: string; activity: string };

const KEY = "nutricare.metrics.v1";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function readAll(): MetricEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MetricEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries: MetricEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(entries));
}

export function addMetric(entry: Omit<MetricEntry, "date"> & { date?: string }) {
  const all = readAll();
  const date = entry.date ?? todayISO();
  const next = [{ ...entry, date } as MetricEntry, ...all].slice(0, 500);
  writeAll(next);
}

export function listMetrics(kind?: MetricKind): MetricEntry[] {
  const all = readAll();
  return kind ? all.filter((e) => e.kind === kind) : all;
}

export function clearMetrics(kind?: MetricKind) {
  if (!kind) {
    writeAll([]);
    return;
  }
  const all = readAll().filter((e) => e.kind !== kind);
  writeAll(all);
}