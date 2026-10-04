import type { PrismaClient } from "@prisma/client";
import type {
  NewNutritionPlan,
  NutritionPlan,
} from "@/lib/nutrition-plan/domain";

export class AdjustmentWorkflowError extends Error {}

export interface AdjustmentWorkflowRepository {
  applyAcceptedAdjustment(
    userId: string,
    evaluationId: string,
    expectedCurrentPlanId: string,
    plan: Omit<NewNutritionPlan, "version">,
  ): Promise<{
    plan: NutritionPlan;
    evaluationId: string;
    adjustmentDecision: "ACCEPTED";
    respondedAt: string;
  }>;
}

function toDomain(plan: {
  id: string;
  version: number;
  goal: "LOSE" | "MAINTAIN" | "GAIN";
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  createdAt: Date;
}): NutritionPlan {
  return {
    id: plan.id,
    version: plan.version,
    goal: plan.goal.toLowerCase() as NutritionPlan["goal"],
    targetCalories: plan.targetCalories,
    proteinG: plan.proteinG,
    carbsG: plan.carbsG,
    fatG: plan.fatG,
    createdAt: plan.createdAt.toISOString(),
  };
}

function toPrismaGoal(value: NewNutritionPlan["goal"]) {
  return value.toUpperCase() as "LOSE" | "MAINTAIN" | "GAIN";
}

export class PrismaAdjustmentWorkflowRepository
  implements AdjustmentWorkflowRepository
{
  constructor(private readonly db: PrismaClient) {}

  async applyAcceptedAdjustment(
    userId: string,
    evaluationId: string,
    expectedCurrentPlanId: string,
    plan: Omit<NewNutritionPlan, "version">,
  ) {
    return this.db.$transaction(async (tx) => {
      const evaluation = await tx.progressEvaluation.findFirst({
        where: {
          id: evaluationId,
          userId,
          planVersionId: expectedCurrentPlanId,
          recommendedAction: "CONSIDER_ADJUSTMENT",
          adjustmentDecision: "PENDING",
        },
      });

      if (!evaluation) {
        throw new AdjustmentWorkflowError(
          "Adjustment recommendation is no longer applicable",
        );
      }

      const latestPlan = await tx.nutritionPlan.findFirst({
        where: { userId },
        orderBy: { version: "desc" },
      });

      if (!latestPlan || latestPlan.id !== expectedCurrentPlanId) {
        throw new AdjustmentWorkflowError(
          "Nutrition plan has changed since the recommendation",
        );
      }

      const nextPlan = await tx.nutritionPlan.create({
        data: {
          userId,
          version: latestPlan.version + 1,
          goal: toPrismaGoal(plan.goal),
          targetCalories: plan.targetCalories,
          proteinG: plan.proteinG,
          carbsG: plan.carbsG,
          fatG: plan.fatG,
        },
      });

      const respondedAt = new Date();

      const updated = await tx.progressEvaluation.updateMany({
        where: {
          id: evaluationId,
          userId,
          planVersionId: expectedCurrentPlanId,
          adjustmentDecision: "PENDING",
        },
        data: {
          adjustmentDecision: "ACCEPTED",
          respondedAt,
        },
      });

      if (updated.count !== 1) {
        throw new AdjustmentWorkflowError(
          "Adjustment decision could not be recorded",
        );
      }

      return {
        plan: toDomain(nextPlan),
        evaluationId,
        adjustmentDecision: "ACCEPTED" as const,
        respondedAt: respondedAt.toISOString(),
      };
    });
  }
}
