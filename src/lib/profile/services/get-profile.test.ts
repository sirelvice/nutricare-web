import { describe, expect, it, vi } from "vitest";
import { GetProfileService } from "./get-profile";
import type { ProfileRepository } from "../repositories/profile-repository";

describe("GetProfileService", () => {
  it("requires a user ID", async () => {
    const repository: ProfileRepository = {
      findByUserId: vi.fn(),
      save: vi.fn(),
    };

    const service = new GetProfileService(repository);

    await expect(service.execute("")).rejects.toThrow("User ID is required");
  });

  it("returns the profile for the user", async () => {
    const profile = {
      heightCm: 175,
      gender: "male" as const,
      age: 30,
      activity: "moderate" as const,
      goal: "lose" as const,
    };

    const repository: ProfileRepository = {
      findByUserId: vi.fn().mockResolvedValue(profile),
      save: vi.fn(),
    };

    const service = new GetProfileService(repository);

    await expect(service.execute("user-123")).resolves.toEqual(profile);
    expect(repository.findByUserId).toHaveBeenCalledWith("user-123");
  });
});
