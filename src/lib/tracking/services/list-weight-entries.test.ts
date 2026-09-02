import { describe, expect, it, vi } from "vitest";
import { ListWeightEntriesService } from "./list-weight-entries";

describe("ListWeightEntriesService", () => {
  it("returns the user's weight entries", async () => {
    const entries = [
      {
        id: "entry-1",
        date: "2026-09-03",
        weightKg: 75,
      },
    ];

    const repository = {
      create: vi.fn(),
      findByUserId: vi.fn().mockResolvedValue(entries),
      delete: vi.fn(),
    };

    const service = new ListWeightEntriesService(repository);

    const result = await service.execute("user-1");

    expect(result).toEqual(entries);
    expect(repository.findByUserId).toHaveBeenCalledWith("user-1");
  });

  it("rejects a missing user ID", async () => {
    const repository = {
      create: vi.fn(),
      findByUserId: vi.fn(),
      delete: vi.fn(),
    };

    const service = new ListWeightEntriesService(repository);

    await expect(service.execute("")).rejects.toThrow("User ID is required");
    expect(repository.findByUserId).not.toHaveBeenCalled();
  });
});
