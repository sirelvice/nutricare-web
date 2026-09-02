import { describe, expect, it, vi } from "vitest";
import { SaveProfileService } from "./save-profile";
import type { UserProfile } from "../domain";
import type { ProfileRepository } from "../repositories/profile-repository";

const validProfile: UserProfile = {
  heightCm: 175,
  gender: "male",
  age: 30,
  activity: "moderate",
  goal: "lose",
};

describe("SaveProfileService", () => {
  it("requires a user ID", async () => {
    const repository: ProfileRepository = {
      findByUserId: vi.fn(),
      save: vi.fn(),
    };

    const service = new SaveProfileService(repository);

    await expect(
      service.execute("", validProfile),
    ).rejects.toThrow("User ID is required");
  });

  it("rejects an invalid profile", async () => {
    const repository: ProfileRepository = {
      findByUserId: vi.fn(),
      save: vi.fn(),
    };

    const service = new SaveProfileService(repository);

    const invalidProfile: UserProfile = {
      ...validProfile,
      heightCm: 300,
    };

    await expect(
      service.execute("user-123", invalidProfile),
    ).rejects.toThrow("Invalid profile");

    expect(repository.save).not.toHaveBeenCalled();
  });

  it("saves a valid profile for the user", async () => {
    const repository: ProfileRepository = {
      findByUserId: vi.fn().mockResolvedValue(validProfile),
      save: vi.fn().mockResolvedValue(validProfile),
    };

    const service = new SaveProfileService(repository);

    await expect(
      service.execute("user-123", validProfile),
    ).resolves.toEqual(validProfile);

    expect(repository.save).toHaveBeenCalledWith(
      "user-123",
      validProfile,
    );
  });
});
