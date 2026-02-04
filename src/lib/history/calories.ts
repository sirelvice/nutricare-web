export type CaloriesHistoryEntry = {
  id: string;
  createdAt: number; // epoch ms
  heightCm: number;
  weightKg: number;
  ageYears: number;
  gender: "male" | "female" | "other";
  activity: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "lose" | "maintain" | "gain";
  bmr: number;
  tdee: number;
  targetCalories: number;
};

const KEY = "nutricare.history.calories.v1";

function safeParse(raw: string | null): CaloriesHistoryEntry[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as CaloriesHistoryEntry[];
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && typeof x.createdAt === "number" && typeof x.tdee === "number")
      .slice(0, 500);
  } catch {
    return [];
  }
}

export function loadCaloriesHistory(): CaloriesHistoryEntry[] {
  if (typeof window === "undefined") return [];
  const items = safeParse(window.localStorage.getItem(KEY));
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export function saveCaloriesHistory(items: CaloriesHistoryEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, 500)));
}

export function addCaloriesHistory(entry: Omit<CaloriesHistoryEntry, "id" | "createdAt">) {
  const items = loadCaloriesHistory();
  const id = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now());
  const next: CaloriesHistoryEntry = { id, createdAt: Date.now(), ...entry };
  saveCaloriesHistory([next, ...items]);
  return next;
}

export function deleteCaloriesHistory(id: string) {
  const items = loadCaloriesHistory().filter((x) => x.id !== id);
  saveCaloriesHistory(items);
  return items;
}

export function clearCaloriesHistory() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
