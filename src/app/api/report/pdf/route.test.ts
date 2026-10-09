import { PDFPage } from "pdf-lib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockExecute } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockExecute: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/report/service", () => ({
  GetReportService: class {
    execute = mockExecute;
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {},
}));

vi.mock("@/lib/profile/repositories/prisma-profile-repository", () => ({
  PrismaProfileRepository: class {},
}));

vi.mock("@/lib/tracking/repositories/prisma-weight-repository", () => ({
  PrismaWeightRepository: class {},
}));

vi.mock("@/lib/nutrition-plan/prisma-repository", () => ({
  prismaNutritionPlanRepository: {},
}));

import { GET } from "@/app/api/report/pdf/route";

describe("GET /api/report/pdf", () => {
  afterEach(() => { vi.restoreAllMocks(); });
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Authentication required.",
    });
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("returns a personal PDF for an authenticated user", async () => {
    const drawText = vi.spyOn(PDFPage.prototype, "drawText");
    mockAuth.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });

    mockExecute.mockResolvedValue({
      generatedAt: "2026-09-06T00:00:00.000Z",
      profile: {
        heightCm: 176,
        gender: "male",
        age: 24,
        activity: "moderate",
        goal: "gain",
      },
      bmi: {
        latest: {
          value: 20,
          category: {
            label: "Normal",
            note: "Within the healthy range.",
          },
        },
      },
      nutritionPlan: {
        id: "plan-1",
        version: 2,
        goal: "gain",
        targetCalories: 2500,
        proteinG: 156,
        carbsG: 313,
        fatG: 69,
        createdAt: "2026-09-06T00:00:00.000Z",
      },
      weight: {
        stats: null,
        entriesCount: 0,
        entries: [],
      },
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toMatch(/application\/pdf/);
    expect(response.headers.get("Content-Disposition")).toContain(
      "nutricare-personal-report.pdf",
    );
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mockExecute).toHaveBeenCalledWith("user-1");
    const text = drawText.mock.calls.map(([value]) => value).join("\n");
    expect(text).toContain("BMI: 20.0 (Normal)");
    expect(text).not.toContain("[object Object]");
    expect(text).toContain("Generated 2026-09-06 00:00:00 UTC");

    const bytes = await response.arrayBuffer();

    expect(bytes.byteLength).toBeGreaterThan(0);
    expect(new Uint8Array(bytes).slice(0, 4)).toEqual(
      new TextEncoder().encode("%PDF"),
    );
  });

  it("returns 404 when the authenticated user has no profile", async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });

    mockExecute.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Profile not found.",
    });
  });

  it("returns 500 when report generation fails", async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });

    mockExecute.mockRejectedValue(new Error("Database failure"));

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Unable to generate report.",
    });
  });
});
