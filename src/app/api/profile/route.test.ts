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
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
    });

    const response = await PUT(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(profile);
    expect(mockSaveExecute).toHaveBeenCalledWith("user-123", profile);
  });
});
