import type { UserProfile } from "../domain";
import { validateProfile } from "../domain";
import type { ProfileRepository } from "../repositories/profile-repository";

export class SaveProfileService {
  constructor(private readonly repository: ProfileRepository) {}

  async execute(
    userId: string,
    profile: UserProfile,
  ): Promise<UserProfile> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!validateProfile(profile)) {
      throw new Error("Invalid profile");
    }

    return this.repository.save(userId, profile);
  }
}
