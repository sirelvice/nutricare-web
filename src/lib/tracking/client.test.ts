import { afterEach, describe, expect, it, vi } from "vitest";
import { parseWeightHistory, readWeightHistory, saveWeightEntry, deleteWeightEntry } from "./client";

const entry = { id: "entry-1", date: "2026-10-07", weightKg: 72.5 };
const draft = { date: entry.date, weightKg: entry.weightKg };
afterEach(() => vi.unstubAllGlobals());

describe("weight response contract", () => {
  it("accepts an explicit empty history and valid measurements", () => {
    expect(parseWeightHistory([])).toEqual([]);
    expect(parseWeightHistory([entry])).toEqual([entry]);
  });
  it.each([null, {}, [{ ...entry, id: "" }], [{ ...entry, date: "2026-02-30" }], [{ ...entry, weightKg: "72.5" }], [{ ...entry, weightKg: 0 }], [entry, entry]])("rejects malformed history: %j", (value) => {
    expect(() => parseWeightHistory(value)).toThrow();
  });
  it("reads without caching and forwards cancellation", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([entry])));
    vi.stubGlobal("fetch", fetch);
    const signal = new AbortController().signal;
    await expect(readWeightHistory(signal)).resolves.toEqual([entry]);
    expect(fetch).toHaveBeenCalledWith("/api/weight-entries", { cache: "no-store", signal });
  });
});

describe("weight write outcomes", () => {
  it("distinguishes saved weight from unavailable progress", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(entry), {
      status: 201, headers: { "X-NutriCare-Progress-Status": "unavailable" },
    }));
    vi.stubGlobal("fetch", fetch);
    const signal = new AbortController().signal;
    await expect(saveWeightEntry(draft, signal)).resolves.toEqual({ entry, progressUnavailable: true });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("/api/weight-entries", expect.objectContaining({ method: "POST", signal, credentials: "same-origin" }));
  });
  it.each([400, 401, 403, 422])("treats HTTP %s as a rejected save", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"error":"private detail"}', { status })));
    await expect(saveWeightEntry(draft, new AbortController().signal)).rejects.toMatchObject({ uncertain: false });
  });
  it.each([500, 503, 409])("treats HTTP %s as an uncertain save", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"error":"private detail"}', { status })));
    await expect(saveWeightEntry(draft, new AbortController().signal)).rejects.toMatchObject({ uncertain: true });
  });
  it.each([{}, { ...entry, weightKg: 90 }])("does not accept malformed or mismatched save responses", async (saved) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(saved), { status: 201 })));
    await expect(saveWeightEntry(draft, new AbortController().signal)).rejects.toMatchObject({ uncertain: true });
  });
  it("does not retry a lost response", async () => {
    const fetch = vi.fn().mockRejectedValue(new Error("private network detail"));
    vi.stubGlobal("fetch", fetch);
    await expect(saveWeightEntry(draft, new AbortController().signal)).rejects.toMatchObject({ uncertain: true });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("keeps deletion failures generic", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"error":"private detail"}', { status: 500 })));
    await expect(deleteWeightEntry("entry-1", new AbortController().signal)).rejects.toThrow("Unable to delete weight entry.");
  });
});
