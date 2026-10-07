import { afterEach, describe, expect, it, vi } from "vitest";
import {
  loadDashboardCore,
  loadDashboardProgress,
  loadDashboardRecommendations,
} from "./dashboard-loader";

afterEach(() => vi.restoreAllMocks());

describe("dashboard loading", () => {
  it("loads core content without requesting optional services", async () => {
    const signal = new AbortController().signal;
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json(null))
      .mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(Response.json({ plan: null }));

    await expect(loadDashboardCore(signal)).resolves.toEqual({
      profile: null, weightEntries: [], nutritionPlan: null,
    });
    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual([
      "/api/profile", "/api/weight-entries", "/api/nutrition-plan",
    ]);
    for (const [, options] of fetchMock.mock.calls) {
      expect(options).toEqual({ signal, cache: "no-store", credentials: "same-origin" });
    }
  });

  it("rejects a failed core response", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(Response.json({ plan: null }));
    await expect(loadDashboardCore(new AbortController().signal)).rejects.toThrow(
      "Unable to load your dashboard data.",
    );
  });

  it("rejects malformed core collection data", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json(null))
      .mockResolvedValueOnce(Response.json({ error: "unexpected" }))
      .mockResolvedValueOnce(Response.json({ plan: null }));
    await expect(loadDashboardCore(new AbortController().signal)).rejects.toThrow();
  });

  it("treats incomplete recommendation setup as empty", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(null, { status: 422 }));
    await expect(loadDashboardRecommendations(new AbortController().signal))
      .resolves.toEqual({ status: "empty" });
  });

  it("treats missing current progress as empty", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(null, { status: 404 }));
    await expect(loadDashboardProgress(new AbortController().signal))
      .resolves.toEqual({ status: "empty" });
  });

  it("returns available recommendations", async () => {
    const data = {
      bmi: 22, category: { label: "Normal", note: "" }, targetCalories: 2000,
      macros: { proteinG: 100, carbsG: 250, fatG: 67 },
      recommendations: {
        summary: "Keep a consistent routine.", priorities: [], foodsToFocus: [],
        foodsToLimit: [], nextSteps: [],
      },
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(Response.json(data));
    await expect(loadDashboardRecommendations(new AbortController().signal))
      .resolves.toEqual({ status: "ready", data });
  });

  it("unwraps available progress", async () => {
    const progress = {
      planVersionId: "plan-1",
      evaluation: {
        id: "evaluation-1", state: "INSUFFICIENT_DATA", changeKg: null,
        entriesCount: 1, evaluationDays: null, evaluatedAt: "2026-10-07T00:00:00Z",
        headline: "Keep logging", summary: "More measurements are needed.",
      },
      recommendation: {
        recommendedAction: "CONTINUE", reason: "insufficient_data",
        adjustmentDecision: "PENDING", respondedAt: null, message: "Keep logging.",
      },
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(Response.json({ progress }));
    await expect(loadDashboardProgress(new AbortController().signal))
      .resolves.toEqual({ status: "ready", data: progress });
  });

  for (const [name, load] of [
    ["recommendations", loadDashboardRecommendations],
    ["progress", loadDashboardProgress],
  ] as const) {
    it.each([401, 403, 500])(`keeps ${name} HTTP %s failures distinct from empty`, async (status) => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(null, { status }));
      await expect(load(new AbortController().signal)).resolves.toEqual({ status: "error" });
    });

    it(`contains ${name} network failures`, async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new TypeError("Network failed"));
      await expect(load(new AbortController().signal)).resolves.toEqual({ status: "error" });
    });

    it(`contains ${name} invalid JSON`, async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("not json"));
      await expect(load(new AbortController().signal)).resolves.toEqual({ status: "error" });
    });

    it(`contains ${name} malformed successful responses`, async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(Response.json({}));
      await expect(load(new AbortController().signal)).resolves.toEqual({ status: "error" });
    });

    it(`propagates ${name} cancellation`, async () => {
      const controller = new AbortController();
      controller.abort();
      const error = new DOMException("Cancelled", "AbortError");
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(error);
      await expect(load(controller.signal)).rejects.toBe(error);
    });
  }
});
