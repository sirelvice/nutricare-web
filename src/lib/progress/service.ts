import type { ProfileRepository } from "@/lib/profile/repositories/profile-repository";
import type { WeightRepository } from "@/lib/tracking/repositories/weight-repository";
import type { NutritionPlanRepository } from "@/lib/nutrition-plan/repository";
import { evaluateProgress, type ProgressEvaluation } from "./domain";

export class EvaluateProgressService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly weightRepository: WeightRepository,
    private readonly nutritionPlanRepository: NutritionPlanRepository,
  ) {}

  async execute(userId: string): Promise<ProgressEvaluation | null> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const profile = await this.profileRepository.findByUserId(userId);

    if (!profile) {
      return null;
    }

    const [entries, currentPlan] = await Promise.all([
      this.weightRepository.findByUserId(userId),
      this.nutritionPlanRepository.findLatestByUserId(userId),
    ]);

    if (!currentPlan) {
      throw new Error("Current nutrition plan is required");
    }

    const periodEntries = entries.filter(
      (entry) => entry.date >= currentPlan.createdAt.slice(0, 10),
    );

    return evaluateProgress({
      goal: profile.goal,
      entries: periodEntries,
    });
  }
}
