import { beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";

const progressExecute = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/progress/get-current-progress-service", () => ({
  GetCurrentProgressService: class {
    async execute(userId: string) {
      return progressExecute(userId);
    }
  },
}));

vi.mock("@/lib/progress/repositories/prisma-progress-evaluation-repository", () => ({
  PrismaProgressEvaluationRepository: class {},
}));


vi.mock("@/lib/db", () => ({
  prisma: {},
}));

import { auth } from "@/auth";
import type { Session } from "next-auth";

const authMock = auth as unknown as MockedFunction<
  () => Promise<Session | null>
>;
import { GET } from "@/app/api/progress/route";

describe("/api/progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Authentication required.",
    });
    expect(progressExecute).not.toHaveBeenCalled();
  });

  it("returns persisted progress and recommendation when authenticated", async () => {
    authMock.mockResolvedValue({
      expires: "2026-12-31T23:59:59.999Z",
      user: {
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        role: "USER",
      },
    } satisfies Session);

    const progress = {
      planVersionId: "plan-1",
      evaluation: {
        state: "ON_TRACK",
        changeKg: -0.6,
        entriesCount: 3,
        evaluationDays: 14,
        evaluatedAt: "2026-09-05T10:10:48.679Z",
      },
      recommendation: {
        recommendedAction: "CONTINUE",
        reason: "on_track",
      },
    };

    progressExecute.mockResolvedValue(progress);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ progress });
    expect(progressExecute).toHaveBeenCalledWith("user-123");
  });

  it("returns 404 when current persisted progress is unavailable", async () => {
    authMock.mockResolvedValue({
      expires: "2026-12-31T23:59:59.999Z",
      user: {
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        role: "USER",
      },
    } satisfies Session);

    progressExecute.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Current progress is not available",
    });
  });

  it("returns 500 when progress loading fails", async () => {
    authMock.mockResolvedValue({
      expires: "2026-12-31T23:59:59.999Z",
      user: {
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        role: "USER",
      },
    } satisfies Session);

    progressExecute.mockRejectedValue(new Error("Database failure"));

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Unable to load current progress",
    });
  });
});
