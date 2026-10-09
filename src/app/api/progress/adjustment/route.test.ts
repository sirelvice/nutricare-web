import { beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";

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
import type { Session } from "next-auth";

const authMock = auth as unknown as MockedFunction<
  () => Promise<Session | null>
>;
import { POST } from "@/app/api/progress/adjustment/route";

describe("POST /api/progress/adjustment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);

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
    authMock.mockResolvedValue({
      expires: "2026-12-31T23:59:59.999Z",
      user: {
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        role: "USER",
      },
    } satisfies Session);

    const response = await POST(
      new Request("http://localhost/api/progress/adjustment", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
        },
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
    authMock.mockResolvedValue({
      expires: "2026-12-31T23:59:59.999Z",
      user: {
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        role: "USER",
      },
    } satisfies Session);

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
        headers: {
          Origin: "http://localhost:3000",
        },
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
    authMock.mockResolvedValue({
      expires: "2026-12-31T23:59:59.999Z",
      user: {
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        role: "USER",
      },
    } satisfies Session);

    respondExecute.mockResolvedValue({
      id: "evaluation-1",
      adjustmentDecision: "DECLINED",
      respondedAt: "2026-09-05T15:00:00.000Z",
    });

    const response = await POST(
      new Request("http://localhost/api/progress/adjustment", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
        },
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
    authMock.mockResolvedValue({
      expires: "2026-12-31T23:59:59.999Z",
      user: {
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        role: "USER",
      },
    } satisfies Session);

    applyExecute.mockRejectedValue(
      new Error("Adjustment response is not applicable"),
    );

    const response = await POST(
      new Request("http://localhost/api/progress/adjustment", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
        },
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
    authMock.mockResolvedValue({
      expires: "2026-12-31T23:59:59.999Z",
      user: {
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        role: "USER",
      },
    } satisfies Session);

    applyExecute.mockRejectedValue(new Error("Database failure"));

    const response = await POST(
      new Request("http://localhost/api/progress/adjustment", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
        },
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
  it("returns 403 and does not call the service for a foreign origin", async () => {
    authMock.mockResolvedValue({
      expires: "2026-12-31T23:59:59.999Z",
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "Test User",
        role: "USER",
      },
    } satisfies Session);

    const request = new Request(
      "http://localhost:3000/api/progress/adjustment",
      {
        method: "POST",
        headers: {
          Origin: "https://attacker.example",
        },
        body: JSON.stringify({
          evaluationId: "evaluation-1",
          decision: "ACCEPTED",
        }),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(applyExecute).not.toHaveBeenCalled();
  });

});

it("contains authentication failures and keeps internal details private", async () => {
  authMock.mockRejectedValueOnce(new Error("private auth detail"));
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    const response = await POST(new Request("http://localhost:3000/api/progress/adjustment", { method: "POST" }));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Unable to process adjustment response." });
    expect(log).toHaveBeenCalled();
  } finally { log.mockRestore(); }
});
