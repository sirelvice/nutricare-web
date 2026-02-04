export type BmiHistoryEntry = {
  id: string;
  createdAt: number; // epoch ms
  heightCm: number;
  weightKg: number;
  bmi: number;
  category:
    | "underweight"
    | "normal"
    | "overweight"
    | "obese1"
    | "obese2"
    | "obese3";
};

const KEY = "nutricare.history.bmi.v1";

function safeParse(raw: string | null): BmiHistoryEntry[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as BmiHistoryEntry[];
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && typeof x.createdAt === "number" && typeof x.bmi === "number")
      .slice(0, 500);
  } catch {
    return [];
  }
}

export function loadBmiHistory(): BmiHistoryEntry[] {
  if (typeof window === "undefined") return [];
  const items = safeParse(window.localStorage.getItem(KEY));
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export function saveBmiHistory(items: BmiHistoryEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, 500)));
}

export function addBmiHistory(entry: Omit<BmiHistoryEntry, "id" | "createdAt">) {
  const items = loadBmiHistory();
  const id = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now());
  const next: BmiHistoryEntry = { id, createdAt: Date.now(), ...entry };
  saveBmiHistory([next, ...items]);
  return next;
}

export function deleteBmiHistory(id: string) {
  const items = loadBmiHistory().filter((x) => x.id !== id);
  saveBmiHistory(items);
  return items;
}

export function clearBmiHistory() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
