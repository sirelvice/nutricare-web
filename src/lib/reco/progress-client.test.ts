import { afterEach, describe, expect, it, vi } from "vitest";
import { readGuidanceProgress } from "./progress-client";

const progress = {
  planVersionId: "plan-1",
  evaluation: { id: "evaluation-1", state: "ON_TRACK", evaluatedAt: "2026-10-07T00:00:00.000Z", headline: "You're moving toward your goal", summary: "Your logged weight decreased by 0.5 kg over 14 days." },
  recommendation: { recommendedAction: "CONTINUE", adjustmentDecision: "PENDING", message: "Continue with your current approach and keep tracking your progress." },
};
afterEach(() => vi.unstubAllGlobals());
describe("plan-specific progress guidance", () => {
  it("returns a matching evaluation without caching", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ progress })));
    vi.stubGlobal("fetch", fetch);
    const signal = new AbortController().signal;
    await expect(readGuidanceProgress("plan-1", signal)).resolves.toMatchObject({ kind: "available", progress });
    expect(fetch).toHaveBeenCalledWith("/api/progress", { cache: "no-store", signal });
  });
  it("does not attach a different plan's evaluation to the current guidance", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ progress }))));
    await expect(readGuidanceProgress("plan-2", new AbortController().signal)).resolves.toEqual({ kind: "outdated" });
  });
  it("distinguishes a missing evaluation from an unavailable service", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
    await expect(readGuidanceProgress("plan-1", new AbortController().signal)).resolves.toEqual({ kind: "not-evaluated" });
  });
  it.each([500, 503])("contains HTTP %s failures", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("private detail", { status })));
    await expect(readGuidanceProgress("plan-1", new AbortController().signal)).rejects.toThrow("Progress is unavailable.");
  });
  it.each([{}, { progress: null }, { progress: { ...progress, evaluation: { ...progress.evaluation, evaluatedAt: "invalid" } } }])("rejects malformed evaluations: %j", async (value) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(value))));
    await expect(readGuidanceProgress("plan-1", new AbortController().signal)).rejects.toThrow();
  });
});
