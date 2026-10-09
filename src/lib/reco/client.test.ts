import { afterEach, describe, expect, it, vi } from "vitest";
import { buildRecommendations } from "./engine";
import { parseRecommendations, readRecommendations } from "./client";

const fixture = {
  context: {
    plan: { id: "plan-1", version: 1, goal: "maintain", createdAt: "2026-10-07T00:00:00.000Z" },
    measurement: { date: "2026-10-07", weightKg: 63.6 },
  },
  bmi: 22, category: { label: "Normal", note: "Within the healthy range." },
  targetCalories: 2200, macros: { proteinG: 138, carbsG: 275, fatG: 61 },
  recommendations: buildRecommendations({ bmi: 22, category: "normal", goal: "maintain" }),
};
afterEach(() => vi.unstubAllGlobals());

describe("recommendations response contract", () => {
  it("accepts complete guidance with recognised action and source links", () => {
    expect(parseRecommendations(fixture).recommendations.actions).toEqual(fixture.recommendations.actions);
  });
  it.each([null, {}, { ...fixture, bmi: "22" }, { ...fixture, targetCalories: 0 },
    { ...fixture, recommendations: {} },
    { ...fixture, recommendations: { ...fixture.recommendations, actions: [{ id: "bad", title: "Unsafe", reason: "Unsafe", href: "//evil.example" }] } },
    { ...fixture, recommendations: { ...fixture.recommendations, sources: [{ title: "Unsafe", url: "javascript:alert(1)" }] } },
  ])("rejects malformed guidance or unsupported links: %j", (value) => {
    expect(() => parseRecommendations(value)).toThrow();
  });
  it("reads without caching and forwards cancellation", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(fixture)));
    vi.stubGlobal("fetch", fetch);
    const signal = new AbortController().signal;
    await expect(readRecommendations(signal)).resolves.toMatchObject({ kind: "ready" });
    expect(fetch).toHaveBeenCalledWith("/api/recommendations", { cache: "no-store", signal });
  });
  it.each([
    ["RECOMMENDATIONS_SETUP_REQUIRED", "setup"],
    ["RECOMMENDATIONS_AGE_REQUIRED", "age-required"],
    ["RECOMMENDATIONS_AGE_UNSUPPORTED", "age-unsupported"],
  ])("recognises %s without trusting server error copy", async (code, kind) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ code, error: "private detail" }), { status: 422 })));
    const result = await readRecommendations(new AbortController().signal);
    expect(result.kind).toBe(kind);
    expect(JSON.stringify(result)).not.toContain("private detail");
  });
  it.each([422, 500, 503])("does not classify unknown HTTP %s failures as missing setup", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"error":"private detail"}', { status })));
    await expect(readRecommendations(new AbortController().signal)).rejects.toThrow("Unable to load recommendations.");
  });
});


it("recognises a plan mismatch without exposing server error text", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: "RECOMMENDATIONS_PLAN_REVIEW_REQUIRED", error: "private detail" }), { status: 409 })));
  await expect(readRecommendations(new AbortController().signal)).resolves.toMatchObject({ kind: "plan-review" });
});
