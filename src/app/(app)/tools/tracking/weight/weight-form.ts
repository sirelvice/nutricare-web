import { validateWeightEntry, type NewWeightEntry } from "@/lib/tracking/domain";

export function parseWeightDraft(date: string, weight: string, note: string): NewWeightEntry | null {
  if (!/^\d+(?:\.\d+)?$/.test(weight.trim())) return null;
  const entry = { date, weightKg: Number(weight.trim()), ...(note.trim() ? { note: note.trim() } : {}) };
  return validateWeightEntry(entry) ? entry : null;
}
