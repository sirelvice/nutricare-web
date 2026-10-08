import { afterEach, describe, expect, it, vi } from "vitest";
import { parseReport, readReport, readReportPDF } from "./client";

const report = {
  generatedAt: "2026-10-08T12:00:00Z",
  profile: { heightCm: 175, age: 30, gender: "male", activity: "moderate", goal: "lose" },
  bmi: { latest: null }, nutritionPlan: null,
  weight: { stats: null, entriesCount: 0, entries: [] }, progress: null,
};
afterEach(() => vi.unstubAllGlobals());
describe("report response contract", () => {
  it("accepts a partial profile report with explicit empty measurements", () => {
    expect(parseReport(report).weight.entries).toEqual([]);
  });
  it.each([null, {}, { ...report, generatedAt: "invalid" }, { ...report, weight: { ...report.weight, entriesCount: 1 } }, { ...report, nutritionPlan: {} }])("rejects malformed data %j", (value) => {
    expect(() => parseReport(value)).toThrow();
  });
  it("distinguishes missing profile from failed reads", async () => {
    const request = vi.fn().mockResolvedValueOnce(new Response(null, { status: 404 })).mockResolvedValueOnce(new Response("untrusted", { status: 500 }));
    vi.stubGlobal("fetch", request);
    const signal = new AbortController().signal;
    await expect(readReport(signal)).resolves.toBeNull();
    await expect(readReport(signal)).rejects.toThrow("Unable to load your report.");
    expect(request).toHaveBeenCalledWith("/api/report", { cache: "no-store", credentials: "same-origin", signal });
  });
});
describe("report download contract", () => {
  it("accepts a PDF response and forwards cancellation", async () => {
    const request = vi.fn().mockResolvedValue(new Response("%PDF-1.7\ncontent", { headers: { "Content-Type": "application/pdf" } }));
    vi.stubGlobal("fetch", request);
    const signal = new AbortController().signal;
    expect((await readReportPDF(signal)).size).toBeGreaterThan(5);
    expect(request).toHaveBeenCalledWith("/api/report/pdf", { cache: "no-store", credentials: "same-origin", signal });
  });
  it.each([
    { status: 500, body: "untrusted detail", type: "application/json" },
    { status: 200, body: "<html>login</html>", type: "text/html" },
    { status: 200, body: "not a PDF", type: "application/pdf" },
  ])("rejects a failed or invalid download %j", async ({ status, body, type }) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status, headers: { "Content-Type": type } })));
    await expect(readReportPDF(new AbortController().signal)).rejects.toThrow();
  });
});
