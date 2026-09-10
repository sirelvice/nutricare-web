import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockAuth, mockDeleteExecute } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDeleteExecute: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  prisma: {},
}));

vi.mock("@/lib/tracking/repositories/prisma-weight-repository", () => ({
  PrismaWeightRepository: class PrismaWeightRepository {},
}));

vi.mock("@/lib/tracking/services/delete-weight-entry", () => ({
  DeleteWeightEntryService: class DeleteWeightEntryService {
    execute = mockDeleteExecute;
  },
}));

import { DELETE } from "./route";

describe("DELETE /api/weight-entries/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await DELETE(
      new Request("http://localhost/api/weight-entries/entry-1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "entry-1" }) },
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Authentication required.",
    });
    expect(mockDeleteExecute).not.toHaveBeenCalled();
  });

  it("returns 400 when the entry ID is missing", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1" },
    });

    const response = await DELETE(
      new Request("http://localhost:3000/api/weight-entries/", {
        method: "DELETE",
        headers: {
          Origin: "http://localhost:3000",
        },
      }),
      { params: Promise.resolve({ id: "" }) },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Weight entry ID is required.",
    });
    expect(mockDeleteExecute).not.toHaveBeenCalled();
  });

  it("deletes the entry using the authenticated user's ID", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1" },
    });

    mockDeleteExecute.mockResolvedValue(undefined);

    const response = await DELETE(
      new Request("http://localhost:3000/api/weight-entries/entry-1", {
        method: "DELETE",
        headers: {
          Origin: "http://localhost:3000",
        },
      }),
      { params: Promise.resolve({ id: "entry-1" }) },
    );

    expect(response.status).toBe(204);
    expect(mockDeleteExecute).toHaveBeenCalledWith("user-1", "entry-1");
  });
  it("returns 403 and does not call the service for a foreign origin", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1" },
    } as never);

    const response = await DELETE(
      new Request(
        "http://localhost:3000/api/weight-entries/entry-1",
        {
          method: "DELETE",
          headers: {
            Origin: "https://attacker.example",
          },
        },
      ),
      {
        params: Promise.resolve({ id: "entry-1" }),
      },
    );

    expect(response.status).toBe(403);
    expect(mockDeleteExecute).not.toHaveBeenCalled();
  });

});
