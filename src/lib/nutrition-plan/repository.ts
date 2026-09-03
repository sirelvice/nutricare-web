import type {
  NewNutritionPlan,
  NutritionPlan,
} from "@/lib/nutrition-plan/domain";

export interface NutritionPlanRepository {
  create(userId: string, plan: NewNutritionPlan): Promise<NutritionPlan>;
  findLatestByUserId(userId: string): Promise<NutritionPlan | null>;
  findAllByUserId(userId: string): Promise<NutritionPlan[]>;
}
