import { describe, expect, it, vi } from "vitest";
import { SaveProfileService } from "./save-profile";
import type { UserProfile } from "../domain";
import type { ProfileRepository } from "../repositories/profile-repository";
import { ChangeGoalService } from "./change-goal";

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

    const service = new SaveProfileService(repository, {
      execute: vi.fn(),
    } as unknown as ChangeGoalService);

    await expect(
      service.execute("", validProfile),
    ).rejects.toThrow("User ID is required");
  });

  it("rejects an invalid profile", async () => {
    const repository: ProfileRepository = {
      findByUserId: vi.fn(),
      save: vi.fn(),
    };

    const service = new SaveProfileService(repository, {
      execute: vi.fn(),
    } as unknown as ChangeGoalService);

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

    const service = new SaveProfileService(repository, {
      execute: vi.fn(),
    } as unknown as ChangeGoalService);

    await expect(
      service.execute("user-123", validProfile),
    ).resolves.toEqual(validProfile);

    expect(repository.save).toHaveBeenCalledWith(
      "user-123",
      validProfile,
    );
  });

  it("saves ordinary profile changes without invoking the goal workflow", async () => {
    const repository: ProfileRepository = {
      findByUserId: vi.fn().mockResolvedValue(validProfile),
      save: vi.fn().mockResolvedValue(validProfile),
    };

    const changeGoalService = {
      execute: vi.fn(),
    } as unknown as ChangeGoalService;

    const service = new SaveProfileService(
      repository,
      changeGoalService,
    );

    await service.execute("user-123", {
      ...validProfile,
      age: 31,
    });

    expect(repository.save).toHaveBeenCalledWith("user-123", {
      ...validProfile,
      age: 31,
    });
    expect(changeGoalService.execute).not.toHaveBeenCalled();
  });

  it("uses the goal-change workflow when an existing goal changes", async () => {
    const repository: ProfileRepository = {
      findByUserId: vi.fn().mockResolvedValue(validProfile),
      save: vi.fn(),
    };

    const changedProfile = {
      ...validProfile,
      goal: "gain" as const,
    };

    const changeGoalService = {
      execute: vi.fn().mockResolvedValue(changedProfile),
    } as unknown as ChangeGoalService;

    const service = new SaveProfileService(
      repository,
      changeGoalService,
    );

    await expect(
      service.execute("user-123", changedProfile),
    ).resolves.toEqual(changedProfile);

    expect(changeGoalService.execute).toHaveBeenCalledWith(
      "user-123",
      "lose",
      changedProfile,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

});
