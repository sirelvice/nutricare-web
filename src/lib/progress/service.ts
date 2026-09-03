import type { ProfileRepository } from "@/lib/profile/repositories/profile-repository";
import type { WeightRepository } from "@/lib/tracking/repositories/weight-repository";
import { evaluateProgress, type ProgressEvaluation } from "./domain";

export class EvaluateProgressService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly weightRepository: WeightRepository,
  ) {}

  async execute(userId: string): Promise<ProgressEvaluation | null> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const profile = await this.profileRepository.findByUserId(userId);

    if (!profile) {
      return null;
    }

    const entries = await this.weightRepository.findByUserId(userId);

    return evaluateProgress({
      goal: profile.goal,
      entries,
    });
  }
}
