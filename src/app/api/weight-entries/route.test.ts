import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockAuth, mockExecute, mockListExecute } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockExecute: vi.fn(),
  mockListExecute: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  prisma: {},
}));

vi.mock("@/lib/tracking/services/record-weight-entry", () => ({
  InvalidWeightEntryError: class InvalidWeightEntryError extends Error {},
  RecordWeightEntryService: class RecordWeightEntryService {
    execute = mockExecute;
  },
}));

vi.mock("@/lib/tracking/repositories/prisma-weight-repository", () => ({
  PrismaWeightRepository: class PrismaWeightRepository {},
}));

vi.mock("@/lib/tracking/services/list-weight-entries", () => ({
  ListWeightEntriesService: class ListWeightEntriesService {
    execute = mockListExecute;
  },
}));

vi.mock("@/lib/nutrition-plan/prisma-repository", () => ({
  prismaNutritionPlanRepository: {
    findLatestByUserId: vi.fn(),
    findAllByUserId: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("@/lib/progress/repositories/prisma-progress-evaluation-repository", () => ({
  PrismaProgressEvaluationRepository: class PrismaProgressEvaluationRepository {},
}));

vi.mock("@/lib/progress/repositories/progress-evaluation-repository", () => ({
  ProgressEvaluationRepository: class {},
}));

vi.mock("@/lib/progress/evaluate-and-record-service", () => ({
  EvaluateAndRecordProgressService: class EvaluateAndRecordProgressService {
    execute = vi.fn().mockResolvedValue(null);
  },
}));

vi.mock("@/lib/profile/repositories/prisma-profile-repository", () => ({
  PrismaProfileRepository: class PrismaProfileRepository {},
}));

import { GET, POST } from "./route";

describe("POST /api/weight-entries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const request = new Request("http://localhost/api/weight-entries", {
      method: "POST",
      body: JSON.stringify({
        date: "2026-09-03",
        weightKg: 60,
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Authentication required.",
    });
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid request body", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1" },
    });

    const request = new Request("http://localhost/api/weight-entries", {
      method: "POST",
      body: JSON.stringify({
        date: "2026-09-03",
        weightKg: "60",
      }),
      headers: {
        "content-type": "application/json",
        Origin: "http://localhost:3000",
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid weight entry.",
    });
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("returns 201 for a valid authenticated request", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1" },
    });

    const savedEntry = {
      id: "entry-1",
      date: "2026-09-03",
      weightKg: 60.5,
      note: "Morning",
    };

    mockExecute.mockResolvedValue(savedEntry);

    const request = new Request("http://localhost/api/weight-entries", {
      method: "POST",
      body: JSON.stringify({
        date: "2026-09-03",
        weightKg: 60.5,
        note: "Morning",
      }),
      headers: {
        "content-type": "application/json",
        Origin: "http://localhost:3000",
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(savedEntry);

    expect(mockExecute).toHaveBeenCalledWith("user-1", {
      date: "2026-09-03",
      weightKg: 60.5,
      note: "Morning",
    });
  });

  it("returns 403 and does not call the service for a foreign origin", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1" },
    } as never);

    const request = new Request(
      "http://localhost:3000/api/weight-entries",
      {
        method: "POST",
        headers: {
          Origin: "https://attacker.example",
        },
        body: JSON.stringify({
          weightKg: 70,
          recordedAt: "2026-09-10T08:00:00.000Z",
        }),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(mockExecute).not.toHaveBeenCalled();
  });

});

describe("GET /api/weight-entries", () => {
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
    expect(mockListExecute).not.toHaveBeenCalled();
  });

  it("returns entries for the authenticated user", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-123" },
    });

    const entries = [
      {
        id: "entry-1",
        date: "2026-09-03",
        weightKg: 75,
      },
    ];

    mockListExecute.mockResolvedValue(entries);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(entries);
    expect(mockListExecute).toHaveBeenCalledWith("user-123");
  });
});
