export type WeightEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  note?: string;
};

export type NewWeightEntry = Omit<WeightEntry, "id">;

function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function validateWeightEntry(entry: NewWeightEntry): boolean {
  const dateValid = isValidDate(entry.date);

  const weightValid =
    Number.isFinite(entry.weightKg) &&
    entry.weightKg >= 20 &&
    entry.weightKg <= 350;

  const noteValid =
    entry.note === undefined ||
    (typeof entry.note === "string" && entry.note.length <= 500);

  return dateValid && weightValid && noteValid;
}

export function summarize(entries: WeightEntry[]) {
  const sorted = [...entries].sort((a, b) =>
    a.date > b.date ? 1 : -1
  );

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
