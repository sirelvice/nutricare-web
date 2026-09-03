import { beforeEach, describe, expect, it, vi } from "vitest";

const progressExecute = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/progress/service", () => ({
  EvaluateProgressService: class {
    async execute(userId: string) {
      return progressExecute(userId);
    }
  },
}));

vi.mock("@/lib/profile/repositories/prisma-profile-repository", () => ({
  PrismaProfileRepository: class {},
}));

vi.mock("@/lib/tracking/repositories/prisma-weight-repository", () => ({
  PrismaWeightRepository: class {},
}));

vi.mock("@/lib/db", () => ({
  prisma: {},
}));

import { auth } from "@/auth";
import { GET } from "@/app/api/progress/route";

describe("/api/progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Unauthorized",
    });
    expect(progressExecute).not.toHaveBeenCalled();
  });

  it("returns progress when authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123" },
    } as any);

    const progress = {
      state: "ON_TRACK",
      changeKg: -0.6,
      entriesCount: 3,
      evaluationDays: 14,
    };

    progressExecute.mockResolvedValue(progress);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ progress });
    expect(progressExecute).toHaveBeenCalledWith("user-123");
  });

  it("returns 404 when the profile does not exist", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123" },
    } as any);

    progressExecute.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Profile not found",
    });
  });

  it("returns 500 when progress evaluation fails", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123" },
    } as any);

    progressExecute.mockRejectedValue(new Error("Database failure"));

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Unable to evaluate progress",
    });
  });
});
