import { calcBMIKgM, bmiCategoryWHO } from "@/lib/calc/bmi";
import type { ProfileRepository } from "@/lib/profile/repositories/profile-repository";
import type { WeightRepository } from "@/lib/tracking/repositories/weight-repository";
import type { NutritionPlanRepository } from "@/lib/nutrition-plan/repository";
import { buildRecommendations, type BmiCategory } from "@/lib/reco/engine";

export class GetRecommendationsService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly weightRepository: WeightRepository,
    private readonly nutritionPlanRepository: NutritionPlanRepository,
  ) {}

  async execute(userId: string) {
    if (!userId) throw new Error("User ID is required");

    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile || profile.heightCm === null) return null;

    const latestWeight =
      await this.weightRepository.findLatestByUserId(userId);

    if (!latestWeight) return null;

    const nutritionPlan =
      await this.nutritionPlanRepository.findLatestByUserId(userId);

    if (!nutritionPlan) return null;

    const bmi = calcBMIKgM(latestWeight.weightKg, profile.heightCm);

    if (bmi === null) return null;

    const categoryInfo = bmiCategoryWHO(bmi);
    const label = categoryInfo.label.toLowerCase();

    const category: BmiCategory =
      label.includes("under")
        ? "underweight"
        : label.includes("normal")
          ? "normal"
          : label.includes("overweight")
            ? "overweight"
            : "obese";

    const recommendations = buildRecommendations({
      bmi,
      category,
      goal: nutritionPlan.goal,
    });

    return {
      bmi,
      category: categoryInfo,
      targetCalories: nutritionPlan.targetCalories,
      macros: {
        proteinG: nutritionPlan.proteinG,
        carbsG: nutritionPlan.carbsG,
        fatG: nutritionPlan.fatG,
      },
      recommendations,
    };
  }
}
