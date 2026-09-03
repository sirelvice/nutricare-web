import { calcBMIKgM, bmiCategoryWHO } from "@/lib/calc/bmi";
import type { UserProfile } from "@/lib/profile/domain";
import type { ProfileRepository } from "@/lib/profile/repositories/profile-repository";
import type { NutritionPlan } from "@/lib/nutrition-plan/domain";
import type { NutritionPlanRepository } from "@/lib/nutrition-plan/repository";
import { summarize, type WeightEntry } from "@/lib/tracking/domain";
import type { WeightRepository } from "@/lib/tracking/repositories/weight-repository";

export type Report = {
  generatedAt: string;
  profile: UserProfile;
  bmi: {
    latest: {
      value: number;
      category: ReturnType<typeof bmiCategoryWHO>;
    } | null;
  };
  nutritionPlan: NutritionPlan | null;
  weight: {
    stats: ReturnType<typeof summarize>;
    entriesCount: number;
    entries: WeightEntry[];
  };
};

export class GetReportService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly weightRepository: WeightRepository,
    private readonly nutritionPlanRepository: NutritionPlanRepository,
  ) {}

  async execute(userId: string): Promise<Report | null> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const [profile, weightEntries, nutritionPlan] = await Promise.all([
      this.profileRepository.findByUserId(userId),
      this.weightRepository.findByUserId(userId),
      this.nutritionPlanRepository.findLatestByUserId(userId),
    ]);

    if (!profile) {
      return null;
    }

    const latestWeight = weightEntries[0] ?? null;

    let bmi: Report["bmi"]["latest"] = null;

    if (latestWeight && profile.heightCm !== null) {
      const value = calcBMIKgM(latestWeight.weightKg, profile.heightCm);

      if (value !== null) {
        bmi = {
          value,
          category: bmiCategoryWHO(value),
        };
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      profile,
      bmi: {
        latest: bmi,
      },
      nutritionPlan,
      weight: {
        stats: summarize(weightEntries),
        entriesCount: weightEntries.length,
        entries: weightEntries,
      },
    };
  }
}
