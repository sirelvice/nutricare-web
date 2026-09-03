import { describe, expect, it, vi } from "vitest";
import {
  InvalidWeightEntryError,
  RecordWeightEntryService,
} from "./record-weight-entry";

describe("RecordWeightEntryService", () => {
  it("records a valid weight entry", async () => {
    const repository = {
      create: vi.fn().mockResolvedValue({
        id: "entry-1",
        date: "2026-09-02",
        weightKg: 60.5,
        note: "Morning weight",
      }),
      findByUserId: vi.fn(),
      delete: vi.fn(),
      findLatestByUserId: vi.fn(),
    };

    const service = new RecordWeightEntryService(repository);

    const result = await service.execute("user-1", {
      date: "2026-09-02",
      weightKg: 60.5,
      note: "Morning weight",
    });

    expect(repository.create).toHaveBeenCalledWith("user-1", {
      date: "2026-09-02",
      weightKg: 60.5,
      note: "Morning weight",
    });

    expect(result).toEqual({
      id: "entry-1",
      date: "2026-09-02",
      weightKg: 60.5,
      note: "Morning weight",
    });
  });

  it("rejects invalid weight data before reaching the repository", async () => {
    const repository = {
      create: vi.fn(),
      findByUserId: vi.fn(),
      delete: vi.fn(),
      findLatestByUserId: vi.fn(),
    };

    const service = new RecordWeightEntryService(repository);

    await expect(
      service.execute("user-1", {
        date: "2026-02-30",
        weightKg: 60,
      }),
    ).rejects.toBeInstanceOf(InvalidWeightEntryError);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it("requires an authenticated user ID", async () => {
    const repository = {
      create: vi.fn(),
      findByUserId: vi.fn(),
      delete: vi.fn(),
      findLatestByUserId: vi.fn(),
    };

    const service = new RecordWeightEntryService(repository);

    await expect(
      service.execute("", {
        date: "2026-09-02",
        weightKg: 60,
      }),
    ).rejects.toThrow("User ID is required");

    expect(repository.create).not.toHaveBeenCalled();
  });
});
