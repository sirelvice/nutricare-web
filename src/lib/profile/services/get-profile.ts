import type { UserProfile } from "@/lib/profile/domain";
import type { ProfileRepository } from "@/lib/profile/repositories/profile-repository";

export class GetProfileService {
  constructor(private readonly repository: ProfileRepository) {}

  async execute(userId: string): Promise<UserProfile | null> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    return this.repository.findByUserId(userId);
  }
}
