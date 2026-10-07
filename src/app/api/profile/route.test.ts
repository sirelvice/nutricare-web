import { GoalChangeError, goalChangeFeedback } from "@/lib/profile/goal-change-errors";
import { GoalChangeConflictError, GoalChangeWorkflowError } from "@/lib/profile/repositories/goal-change-workflow-repository";
import { describe, expect, it, vi, beforeEach } from "vitest";

const {
  mockAuth,
  mockGetExecute,
  mockSaveExecute,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetExecute: vi.fn(),
  mockSaveExecute: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  prisma: {},
}));

vi.mock("@/lib/profile/services/get-profile", () => ({
  GetProfileService: class {
    execute = mockGetExecute;
  },
}));

vi.mock("@/lib/profile/services/save-profile", () => ({
  SaveProfileService: class {
    execute = mockSaveExecute;
  },
}));

vi.mock("@/lib/profile/repositories/prisma-profile-repository", () => ({
  PrismaProfileRepository: class {},
}));

import { GET, PUT } from "./route";

describe("Profile API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Authentication required.",
    });
  });

  it("GET returns the authenticated user's profile", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-123" },
    });

    const profile = {
      heightCm: 175,
      age: 30,
      gender: "male",
      activity: "moderate",
      goal: "lose",
    };

    mockGetExecute.mockResolvedValue(profile);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(profile);
    expect(mockGetExecute).toHaveBeenCalledWith("user-123");
  });

  it("PUT returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const request = new Request("http://localhost/api/profile", {
      method: "PUT",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PUT(request);

    expect(response.status).toBe(401);
  });

  it("PUT returns 400 for invalid profile data", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-123" },
    });

    const request = new Request("http://localhost/api/profile", {
      method: "PUT",
      body: JSON.stringify({
        heightCm: 300,
        age: 30,
        gender: "male",
        activity: "moderate",
        goal: "lose",
      }),
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
    });

    const response = await PUT(request);

    expect(response.status).toBe(400);
    expect(mockSaveExecute).not.toHaveBeenCalled();
  });

  it("PUT saves a valid profile for the authenticated user", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-123" },
    });

    const profile = {
      heightCm: 175,
      age: 30,
      gender: "male",
      activity: "moderate",
      goal: "lose",
    };

    mockSaveExecute.mockResolvedValue(profile);

    const request = new Request("http://localhost/api/profile", {
      method: "PUT",
      body: JSON.stringify(profile),
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
    });

    const response = await PUT(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(profile);
    expect(mockSaveExecute).toHaveBeenCalledWith("user-123", profile);
  });
  it("returns 403 and does not call the service for a foreign origin", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1" },
    } as never);

    const request = new Request(
      "http://localhost:3000/api/profile",
      {
        method: "PUT",
        headers: {
          Origin: "https://attacker.example",
        },
        body: JSON.stringify({
          firstName: "Updated",
        }),
      },
    );

    const response = await PUT(request);

    expect(response.status).toBe(403);
    expect(mockSaveExecute).not.toHaveBeenCalled();
  });

  it.each([
    { age: 30.5 },
    { gender: "unsupported" },
    { activity: "unsupported" },
    { goal: "unsupported" },
  ])("rejects invalid profile fields before persistence: %j", async (invalid) => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    const response = await PUT(new Request("http://localhost:3000/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({
        heightCm: 175, age: 30, gender: "male",
        activity: "moderate", goal: "maintain", ...invalid,
      }),
    }));
    expect(response.status).toBe(400);
    expect(mockSaveExecute).not.toHaveBeenCalled();
  });

  it("uses session ownership and excludes a supplied user ID from profile data", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    const profile = {
      heightCm: 175, age: 30, gender: "male",
      activity: "moderate", goal: "maintain",
    };
    mockSaveExecute.mockResolvedValue(profile);
    const response = await PUT(new Request("http://localhost:3000/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({ ...profile, userId: "another-user" }),
    }));
    expect(response.status).toBe(200);
    expect(mockSaveExecute).toHaveBeenCalledWith("user-123", profile);
  });

  it.each([
    new GoalChangeError("GOAL_CHANGE_WEIGHT_REQUIRED", "Internal weight prerequisite"),
    new GoalChangeError("GOAL_CHANGE_PLAN_UNAVAILABLE", "Internal calculation prerequisite"),
    new GoalChangeError("GOAL_CHANGE_CONFLICT", "Internal stale plan"),
    new GoalChangeConflictError("Internal stale transaction"),
  ])("returns actionable feedback for a known goal change failure: %s", async (error) => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockSaveExecute.mockRejectedValueOnce(error);
    const response = await PUT(new Request("http://localhost:3000/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({ heightCm: 175, age: 30, gender: "male", activity: "moderate", goal: "gain" }),
    }));
    const code = error instanceof GoalChangeError ? error.code : "GOAL_CHANGE_CONFLICT";
    expect(response.status).toBe(goalChangeFeedback[code].status);
    expect(await response.json()).toEqual({ code, error: goalChangeFeedback[code].message });
  });

  it.each([
    new Error("Database connection details"),
    new GoalChangeWorkflowError("Profile missing after transaction"),
  ])("keeps unexpected failures generic: %s", async (error) => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockSaveExecute.mockRejectedValueOnce(error);
    const response = await PUT(new Request("http://localhost:3000/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({ heightCm: 175, age: 30, gender: "male", activity: "moderate", goal: "gain" }),
    }));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Unable to save profile." });
  });

});
