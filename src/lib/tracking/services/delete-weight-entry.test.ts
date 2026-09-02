import { describe, expect, it, vi } from "vitest";
import { DeleteWeightEntryService } from "./delete-weight-entry";

describe("DeleteWeightEntryService", () => {
  it("deletes the user's weight entry", async () => {
    const repository = {
      create: vi.fn(),
      findByUserId: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    const service = new DeleteWeightEntryService(repository);

    await service.execute("user-1", "entry-1");

    expect(repository.delete).toHaveBeenCalledWith("user-1", "entry-1");
  });

  it("rejects a missing user ID", async () => {
    const repository = {
      create: vi.fn(),
      findByUserId: vi.fn(),
      delete: vi.fn(),
    };

    const service = new DeleteWeightEntryService(repository);

    await expect(
      service.execute("", "entry-1"),
    ).rejects.toThrow("User ID is required");

    expect(repository.delete).not.toHaveBeenCalled();
  });

  it("rejects a missing entry ID", async () => {
    const repository = {
      create: vi.fn(),
      findByUserId: vi.fn(),
      delete: vi.fn(),
    };

    const service = new DeleteWeightEntryService(repository);

    await expect(
      service.execute("user-1", ""),
    ).rejects.toThrow("Weight entry ID is required");

    expect(repository.delete).not.toHaveBeenCalled();
  });
});
