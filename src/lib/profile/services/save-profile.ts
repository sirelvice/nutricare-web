import type { UserProfile } from "../domain";
import { validateProfile } from "../domain";
import type { ProfileRepository } from "../repositories/profile-repository";
import { ChangeGoalService } from "./change-goal";

export class SaveProfileService {
  constructor(
    private readonly repository: ProfileRepository,
    private readonly changeGoalService: ChangeGoalService,
  ) {}

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

    const existing = await this.repository.findByUserId(userId);

    if (existing && existing.goal !== profile.goal) {
      return this.changeGoalService.execute(
        userId,
        existing.goal,
        profile,
      );
    }

    return this.repository.save(userId, profile);
  }
}
