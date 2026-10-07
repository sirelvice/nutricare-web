import { Prisma } from "@prisma/client";
import { NutritionPlanConflictError } from "@/lib/nutrition-plan/errors";
import { prisma } from "@/lib/db";
import type {
  NewNutritionPlan,
  NutritionPlan,
} from "@/lib/nutrition-plan/domain";
import type { NutritionPlanRepository } from "@/lib/nutrition-plan/repository";

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

function toPrismaGoal(goal: NewNutritionPlan["goal"]) {
  return goal.toUpperCase() as "LOSE" | "MAINTAIN" | "GAIN";
}

export const prismaNutritionPlanRepository: NutritionPlanRepository = {
  async create(userId, plan) {
    try {
      const created = await prisma.nutritionPlan.create({
        data: {
          userId,
          version: plan.version,
          goal: toPrismaGoal(plan.goal),
          targetCalories: plan.targetCalories,
          proteinG: plan.proteinG,
          carbsG: plan.carbsG,
          fatG: plan.fatG,
        },
      });

      return toDomain(created);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new NutritionPlanConflictError();
      }

      throw error;
    }
  },

  async findLatestByUserId(userId) {
    const plan = await prisma.nutritionPlan.findFirst({
      where: { userId },
      orderBy: { version: "desc" },
    });

    return plan ? toDomain(plan) : null;
  },

  async findAllByUserId(userId) {
    const plans = await prisma.nutritionPlan.findMany({
      where: { userId },
      orderBy: { version: "desc" },
    });

    return plans.map(toDomain);
  },
};
