import { beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";
import type { Session } from "next-auth";

const generateExecute = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/nutrition-plan/service", () => ({
  GetLatestNutritionPlanService: class {
    async execute() {
      return undefined;
    }
  },
}));

vi.mock("@/lib/nutrition-plan/generate-service", () => ({
  GenerateNutritionPlanService: class {
    async execute(userId: string) {
      return generateExecute(userId);
    }
  },
}));

vi.mock("@/lib/nutrition-plan/prisma-repository", () => ({
  prismaNutritionPlanRepository: {},
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
const authMock = auth as unknown as MockedFunction<
  () => Promise<Session | null>
>;
import { GET, POST } from "@/app/api/nutrition-plan/route";

describe("/api/nutrition-plan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("GET returns 200 when authenticated", async () => {
    authMock.mockResolvedValue({
      expires: "2026-12-31T23:59:59.999Z",
      user: {
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        role: "USER",
      },
    } satisfies Session);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      plan: undefined,
    });
  });

  it("POST returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/nutrition-plan", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
        },
      }),
    );

    expect(response.status).toBe(401);
  });

  it("POST returns 422 when profile or current weight is missing", async () => {
    authMock.mockResolvedValue({
      expires: "2026-12-31T23:59:59.999Z",
      user: {
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        role: "USER",
      },
    } satisfies Session);

    generateExecute.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost:3000/api/nutrition-plan", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
        },
      }),
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      error:
        "Profile and current weight are required to generate a nutrition plan",
    });
    expect(generateExecute).toHaveBeenCalledWith("user-123");
  });

  it("POST returns 201 with the generated plan", async () => {
    authMock.mockResolvedValue({
      expires: "2026-12-31T23:59:59.999Z",
      user: {
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        role: "USER",
      },
    } satisfies Session);

    const plan = {
      id: "plan-1",
      version: 1,
      goal: "lose",
      targetCalories: 2053,
      proteinG: 154,
      carbsG: 231,
      fatG: 57,
      createdAt: "2026-09-03T00:00:00.000Z",
    };

    generateExecute.mockResolvedValue(plan);

    const response = await POST(
      new Request("http://localhost:3000/api/nutrition-plan", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
        },
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ plan });
    expect(generateExecute).toHaveBeenCalledWith("user-123");
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
      "http://localhost:3000/api/nutrition-plan",
      {
        method: "POST",
        headers: {
          Origin: "https://attacker.example",
        },
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(generateExecute).not.toHaveBeenCalled();
  });

});
