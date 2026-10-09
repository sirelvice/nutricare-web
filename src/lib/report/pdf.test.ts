import { afterEach, describe, expect, it, vi } from "vitest";
import { PDFDocument, PDFPage } from "pdf-lib";
import { renderReportPDF } from "./pdf";
import type { Report } from "./service";
const report: Report = {
  generatedAt: "2026-10-08T12:00:00Z", profile: { heightCm: null, age: 30, gender: "male", activity: "moderate", goal: "lose" },
  bmi: { latest: null }, nutritionPlan: null, weight: { stats: null, entriesCount: 0, entries: [] }, progress: null,
};
afterEach(() => vi.restoreAllMocks());
describe("personal report PDF", () => {
  it("renders empty measurements without invented units or values", async () => {
    const draw = vi.spyOn(PDFPage.prototype, "drawText");
    const bytes = await renderReportPDF(report);
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
    const text = draw.mock.calls.map(([value]) => value).join("\n");
    expect(text).toContain("Height\nNot provided");
    expect(text).toContain("Age\n30 years");
    expect(text).toContain("PERSONAL REPORT");
    expect(text).toContain("No progress evaluation available");
    expect(text).not.toContain("Not provided cm");
    expect(text).toContain("1 / 1");
  });
  it("keeps a representative complete report on one A4 page", async () => {
    const images = vi.spyOn(PDFPage.prototype, "drawImage");
    const plan = { id: "plan-1", version: 2, goal: "lose" as const, targetCalories: 2000, proteinG: 100, carbsG: 250, fatG: 67, createdAt: report.generatedAt };
    const first = { id: "weight-1", date: "2026-09-01", weightKg: 74 };
    const last = { id: "weight-2", date: "2026-10-08", weightKg: 73 };
    const bytes = await renderReportPDF({
      ...report, profile: { ...report.profile, heightCm: 175 },
      bmi: { latest: { value: 23.8, category: { label: "Normal", note: "Within the healthy range." } } },
      nutritionPlan: plan,
      weight: { entries: [last, first], entriesCount: 2, stats: { first, last, change: -1, count: 2 } },
      progress: {
        planVersionId: plan.id,
        evaluation: { id: "eval-1", state: "ON_TRACK", changeKg: -1, entriesCount: 2, evaluationDays: 37, evaluatedAt: report.generatedAt, headline: "You are moving toward your goal", summary: "Your logged weight decreased by 1.0 kg over 37 days." },
        recommendation: { recommendedAction: "CONTINUE", reason: "on_track", adjustmentDecision: "PENDING", respondedAt: null, message: "Your recent results are consistent with your current goal." },
      },
    });
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBe(1);
    expect(document.getPage(0).getWidth()).toBeCloseTo(595.28);
    expect(images).toHaveBeenCalledTimes(1);
  });
  it("wraps long progress copy and adds pages without touching the footer", async () => {
    const draw = vi.spyOn(PDFPage.prototype, "drawText");
    const images = vi.spyOn(PDFPage.prototype, "drawImage");
    const plan = { id: "plan-1", version: 1, goal: "lose" as const, targetCalories: 2000, proteinG: 100, carbsG: 250, fatG: 67, createdAt: report.generatedAt };
    const progress = {
      planVersionId: plan.id,
      evaluation: { id: "eval-1", state: "ON_TRACK" as const, changeKg: 1, entriesCount: 2, evaluationDays: 14, evaluatedAt: report.generatedAt, headline: "Progress headline", summary: "Progress detail ".repeat(500) },
      recommendation: { recommendedAction: "CONTINUE" as const, reason: "on_track" as const, adjustmentDecision: "PENDING" as const, respondedAt: null, message: "Next step" },
    };
    const bytes = await renderReportPDF({ ...report, nutritionPlan: plan, progress });
    const pageCount = (await PDFDocument.load(bytes)).getPageCount();
    expect(pageCount).toBeGreaterThan(1);
    expect(images).toHaveBeenCalledTimes(pageCount);
    for (const [text, options] of draw.mock.calls) {
      if (options?.y === 32) continue; // Page footer.
      expect(options?.y).toBeGreaterThanOrEqual(72);
      expect((options?.font?.widthOfTextAtSize(text, options.size ?? 10) ?? 0)).toBeLessThanOrEqual(499.28);
    }
    expect(draw.mock.calls.map(([text]) => text).join("\n")).toContain("Next step");
  });
});
