import type { ProfileRepository } from "@/lib/profile/repositories/profile-repository";
import type { WeightRepository } from "@/lib/tracking/repositories/weight-repository";
import type { NutritionPlanRepository } from "@/lib/nutrition-plan/repository";
import { calculateNutritionPlan } from "@/lib/nutrition-plan/calculation-service";
import { CreateNutritionPlanService } from "@/lib/nutrition-plan/service";

export class GenerateNutritionPlanService {
  private readonly createPlanService: CreateNutritionPlanService;

  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly weightRepository: WeightRepository,
    nutritionPlanRepository: NutritionPlanRepository,
  ) {
    this.createPlanService = new CreateNutritionPlanService(
      nutritionPlanRepository,
    );
  }

  async execute(userId: string) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      return null;
    }

    const latestWeight =
      await this.weightRepository.findLatestByUserId(userId);

    if (!latestWeight) {
      return null;
    }

    const calculation = calculateNutritionPlan({
      profile,
      weightKg: latestWeight.weightKg,
    });

    if (!calculation) {
      return null;
    }

    return this.createPlanService.execute(userId, calculation);
  }
}
