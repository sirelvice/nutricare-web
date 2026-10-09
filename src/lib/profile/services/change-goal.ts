import { GoalChangeError } from "../goal-change-errors";
import type { Goal, UserProfile } from "../domain";
import type { WeightRepository } from "@/lib/tracking/repositories/weight-repository";
import type { NutritionPlanRepository } from "@/lib/nutrition-plan/repository";
import { calculateNutritionPlan } from "@/lib/nutrition-plan/calculation-service";
import type { GoalChangeWorkflowRepository } from "../repositories/goal-change-workflow-repository";

export class ChangeGoalService {
  constructor(
    private readonly weightRepository: WeightRepository,
    private readonly nutritionPlanRepository: NutritionPlanRepository,
    private readonly workflowRepository: GoalChangeWorkflowRepository,
  ) {}

  async execute(
    userId: string,
    previousGoal: Goal,
    profile: UserProfile,
  ): Promise<UserProfile> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const currentPlan =
      await this.nutritionPlanRepository.findLatestByUserId(userId);

    if (currentPlan && currentPlan.goal !== previousGoal) {
      throw new GoalChangeError(
        "GOAL_CHANGE_CONFLICT",
        "Nutrition plan has changed since the goal was loaded",
      );
    }

    const latestWeight =
      await this.weightRepository.findLatestByUserId(userId);

    if (!latestWeight) {
      throw new GoalChangeError("GOAL_CHANGE_WEIGHT_REQUIRED", "Weight entry is required to change goal");
    }

    const calculation = calculateNutritionPlan({
      profile,
      weightKg: latestWeight.weightKg,
    });

    if (!calculation) {
      throw new GoalChangeError("GOAL_CHANGE_PLAN_UNAVAILABLE", "Unable to calculate nutrition plan for new goal");
    }

    const result = await this.workflowRepository.changeGoal(
      userId,
      previousGoal,
      currentPlan?.id ?? null,
      profile,
      calculation,
    );

    return result.profile;
  }
}
