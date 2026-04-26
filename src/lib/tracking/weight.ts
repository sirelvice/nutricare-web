export type WeightEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  note?: string;
};

const KEY = "nutricare.weight.v1";

/**
 * Ensure all entries have IDs (fix legacy data)
 */
function ensureIds(entries: WeightEntry[]): WeightEntry[] {
  return entries.map((e) => ({
    ...e,
    id:
      e.id ??
      (crypto?.randomUUID
        ? crypto.randomUUID()
        : String(Date.now() + Math.random())),
  }));
}

function safeParse(raw: string | null): WeightEntry[] {
  if (!raw) return [];

  try {
    const arr = JSON.parse(raw) as WeightEntry[];

    if (!Array.isArray(arr)) return [];

    return arr
      .filter(
        (x) =>
          x &&
          typeof x.date === "string" &&
          typeof x.weightKg === "number"
      )
      .slice(0, 3650); // safety cap
  } catch {
    return [];
  }
}

export function loadWeightEntries(): WeightEntry[] {
  if (typeof window === "undefined") return [];

  const parsed = safeParse(window.localStorage.getItem(KEY));

  // ✅ Fix legacy entries without IDs
  const withIds = ensureIds(parsed);

  // ✅ Persist repaired data (important)
  window.localStorage.setItem(KEY, JSON.stringify(withIds));

  // sort DESC (latest first)
  return withIds.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function saveWeightEntries(entries: WeightEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(entries));
}

export function addWeightEntry(entry: Omit<WeightEntry, "id">) {
  const entries = loadWeightEntries();

  const id = crypto?.randomUUID
    ? crypto.randomUUID()
    : String(Date.now());

  const next: WeightEntry = { id, ...entry };

  saveWeightEntries([next, ...entries]);

  return next;
}

export function deleteWeightEntry(id: string) {
  const entries = loadWeightEntries().filter((e) => e.id !== id);
  saveWeightEntries(entries);
  return entries;
}

export function summarize(entries: WeightEntry[]) {
  const sorted = [...entries].sort((a, b) =>
    a.date > b.date ? 1 : -1
  ); // ascending

  if (sorted.length === 0) return null;

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const change = Number(
    (last.weightKg - first.weightKg).toFixed(1)
  );

  return {
    first,
    last,
    change,
    count: sorted.length,
  };
}