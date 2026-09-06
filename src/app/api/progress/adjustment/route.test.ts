import { beforeEach, describe, expect, it, vi } from "vitest";

const respondExecute = vi.hoisted(() => vi.fn());
const applyExecute = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {},
}));

vi.mock(
  "@/lib/progress/repositories/prisma-progress-evaluation-repository",
  () => ({
    PrismaProgressEvaluationRepository: class {},
  }),
);

vi.mock("@/lib/progress/respond-to-adjustment-service", () => ({
  RespondToAdjustmentService: class {
    async execute(userId: string, input: unknown) {
      return respondExecute(userId, input);
    }
  },
}));

vi.mock("@/lib/progress/apply-plan-adjustment-service", () => ({
  ApplyPlanAdjustmentService: class {
    async execute(userId: string, evaluationId: string) {
      return applyExecute(userId, evaluationId);
    }
  },
}));

import { auth } from "@/auth";
import { POST } from "@/app/api/progress/adjustment/route";

describe("POST /api/progress/adjustment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const response = await POST(
      new Request("http://localhost/api/progress/adjustment", {
        method: "POST",
        body: JSON.stringify({
          evaluationId: "evaluation-1",
          decision: "ACCEPTED",
        }),
      }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Authentication required.",
    });
    expect(respondExecute).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid request body", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123" },
    } as any);

    const response = await POST(
      new Request("http://localhost/api/progress/adjustment", {
        method: "POST",
        body: JSON.stringify({
          evaluationId: "evaluation-1",
          decision: "PENDING",
          userId: "attacker",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid adjustment response.",
    });
    expect(respondExecute).not.toHaveBeenCalled();
  });

  it("applies an accepted adjustment and returns the new plan", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123" },
    } as any);

    applyExecute.mockResolvedValue({
      evaluationId: "evaluation-1",
      adjustmentDecision: "ACCEPTED",
      respondedAt: "2026-09-05T15:00:00.000Z",
      plan: {
        id: "plan-2",
        version: 2,
        goal: "lose",
        targetCalories: 2053,
        proteinG: 154,
        carbsG: 231,
        fatG: 57,
        createdAt: "2026-09-05T15:00:00.000Z",
      },
    });

    const response = await POST(
      new Request("http://localhost/api/progress/adjustment", {
        method: "POST",
        body: JSON.stringify({
          evaluationId: "evaluation-1",
          decision: "ACCEPTED",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      evaluationId: "evaluation-1",
      adjustmentDecision: "ACCEPTED",
      respondedAt: "2026-09-05T15:00:00.000Z",
      plan: {
        id: "plan-2",
        version: 2,
        goal: "lose",
        targetCalories: 2053,
        proteinG: 154,
        carbsG: 231,
        fatG: 57,
        createdAt: "2026-09-05T15:00:00.000Z",
      },
    });

    expect(applyExecute).toHaveBeenCalledWith(
      "user-123",
      "evaluation-1",
    );
    expect(respondExecute).not.toHaveBeenCalled();
  });

  it("records a declined adjustment response", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123" },
    } as any);

    respondExecute.mockResolvedValue({
      id: "evaluation-1",
      adjustmentDecision: "DECLINED",
      respondedAt: "2026-09-05T15:00:00.000Z",
    });

    const response = await POST(
      new Request("http://localhost/api/progress/adjustment", {
        method: "POST",
        body: JSON.stringify({
          evaluationId: "evaluation-1",
          decision: "DECLINED",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      evaluationId: "evaluation-1",
      adjustmentDecision: "DECLINED",
      respondedAt: "2026-09-05T15:00:00.000Z",
    });
    expect(respondExecute).toHaveBeenCalledWith("user-123", {
      evaluationId: "evaluation-1",
      decision: "DECLINED",
    });
    expect(applyExecute).not.toHaveBeenCalled();
  });

  it("returns 409 when the evaluation cannot accept a response", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123" },
    } as any);

    applyExecute.mockRejectedValue(
      new Error("Adjustment response is not applicable"),
    );

    const response = await POST(
      new Request("http://localhost/api/progress/adjustment", {
        method: "POST",
        body: JSON.stringify({
          evaluationId: "evaluation-1",
          decision: "ACCEPTED",
        }),
      }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "Adjustment response is not applicable",
    });
  });

  it("returns 500 for an unexpected service failure", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123" },
    } as any);

    applyExecute.mockRejectedValue(new Error("Database failure"));

    const response = await POST(
      new Request("http://localhost/api/progress/adjustment", {
        method: "POST",
        body: JSON.stringify({
          evaluationId: "evaluation-1",
          decision: "ACCEPTED",
        }),
      }),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Unable to process adjustment response.",
    });
  });
});
