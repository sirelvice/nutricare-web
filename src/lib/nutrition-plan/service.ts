import {
  validateNutritionPlan,
  type NewNutritionPlan,
  type NutritionPlan,
} from "@/lib/nutrition-plan/domain";
import type { NutritionPlanRepository } from "@/lib/nutrition-plan/repository";

export class CreateNutritionPlanService {
  constructor(private readonly repository: NutritionPlanRepository) {}

  async execute(
    userId: string,
    plan: Omit<NewNutritionPlan, "version">
  ): Promise<NutritionPlan> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const latest = await this.repository.findLatestByUserId(userId);
    const version = (latest?.version ?? 0) + 1;

    const newPlan: NewNutritionPlan = {
      ...plan,
      version,
    };

    if (!validateNutritionPlan(newPlan)) {
      throw new Error("Invalid nutrition plan");
    }

    return this.repository.create(userId, newPlan);
  }
}

export class GetLatestNutritionPlanService {
  constructor(private readonly repository: NutritionPlanRepository) {}

  async execute(userId: string): Promise<NutritionPlan | null> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    return this.repository.findLatestByUserId(userId);
  }
}

export class GetNutritionPlanHistoryService {
  constructor(private readonly repository: NutritionPlanRepository) {}

  async execute(userId: string): Promise<NutritionPlan[]> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    return this.repository.findAllByUserId(userId);
  }
}
