import { z } from "zod";
import { validateWeightEntry, type NewWeightEntry } from "./domain";

const entrySchema = z.object({
  id: z.string().min(1),
  date: z.string(),
  weightKg: z.number(),
  note: z.string().max(500).optional(),
}).refine(validateWeightEntry);

export function parseWeightHistory(value: unknown) {
  const entries = z.array(entrySchema).parse(value);
  const ids = new Set<string>();
  for (const entry of entries) {
    if (ids.has(entry.id)) throw new Error("Duplicate weight entry IDs.");
    ids.add(entry.id);
  }
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

export class WeightSaveError extends Error {
  constructor(public readonly uncertain: boolean, message?: string) {
    super(message ?? (uncertain
      ? "We could not confirm the save. Check your history before adding another entry."
      : "The entry was not accepted. Check the date, weight and note."));
  }
}

export async function readWeightHistory(signal: AbortSignal) {
  const response = await fetch("/api/weight-entries", { cache: "no-store", signal });
  if (!response.ok) throw new Error("Unable to load weight history.");
  return parseWeightHistory(await response.json());
}

export async function saveWeightEntry(entry: NewWeightEntry, signal: AbortSignal) {
  let response: Response;
  try {
    response = await fetch("/api/weight-entries", {
      method: "POST", credentials: "same-origin", signal,
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry),
    });
  } catch { throw new WeightSaveError(true); }
  if ([401, 403].includes(response.status)) {
    throw new WeightSaveError(false, "We could not authorise this save. Refresh the page and sign in again.");
  }
  if (!response.ok) throw new WeightSaveError(![400, 422].includes(response.status));
  if (response.status !== 201) throw new WeightSaveError(true);
  try {
    const saved = entrySchema.parse(await response.json());
    if (saved.date !== entry.date || saved.weightKg !== entry.weightKg || saved.note !== entry.note) {
      throw new Error("Unexpected saved measurement.");
    }
    return { entry: saved, progressUnavailable: response.headers.get("X-NutriCare-Progress-Status") === "unavailable" };
  } catch { throw new WeightSaveError(true); }
}

export async function deleteWeightEntry(id: string, signal: AbortSignal) {
  const response = await fetch(`/api/weight-entries/${encodeURIComponent(id)}`, {
    method: "DELETE", credentials: "same-origin", signal,
  });
  if (response.status !== 204) throw new Error("Unable to delete weight entry.");
}
