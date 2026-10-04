import type { PrismaClient } from "@prisma/client";
import type {
  NewNutritionPlan,
  NutritionPlan,
} from "@/lib/nutrition-plan/domain";
import type { Goal, UserProfile } from "../domain";

export class GoalChangeWorkflowError extends Error {}

export interface GoalChangeWorkflowRepository {
  changeGoal(
    userId: string,
    expectedCurrentGoal: Goal,
    expectedCurrentPlanId: string | null,
    profile: UserProfile,
    plan: Omit<NewNutritionPlan, "version">,
  ): Promise<{
    profile: UserProfile;
    plan: NutritionPlan;
  }>;
}

function toPrismaGender(value: UserProfile["gender"]) {
  return value.toUpperCase() as "MALE" | "FEMALE" | "OTHER";
}

function toPrismaActivity(value: UserProfile["activity"]) {
  return value.toUpperCase() as
    | "SEDENTARY"
    | "LIGHT"
    | "MODERATE"
    | "ACTIVE"
    | "VERY_ACTIVE";
}

function toPrismaGoal(value: Goal) {
  return value.toUpperCase() as "LOSE" | "MAINTAIN" | "GAIN";
}

function toDomainProfile(profile: {
  heightCm: number | null;
  age: number | null;
  gender: "MALE" | "FEMALE" | "OTHER";
  activity: "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE";
  goal: "LOSE" | "MAINTAIN" | "GAIN";
}): UserProfile {
  return {
    heightCm: profile.heightCm,
    age: profile.age,
    gender: profile.gender.toLowerCase() as UserProfile["gender"],
    activity: profile.activity.toLowerCase() as UserProfile["activity"],
    goal: profile.goal.toLowerCase() as UserProfile["goal"],
  };
}

function toDomainPlan(plan: {
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

export class PrismaGoalChangeWorkflowRepository
  implements GoalChangeWorkflowRepository
{
  constructor(private readonly db: PrismaClient) {}

  async changeGoal(
    userId: string,
    expectedCurrentGoal: Goal,
    expectedCurrentPlanId: string | null,
    profile: UserProfile,
    plan: Omit<NewNutritionPlan, "version">,
  ) {
    return this.db.$transaction(async (tx) => {
      const latestPlan = await tx.nutritionPlan.findFirst({
        where: { userId },
        orderBy: { version: "desc" },
      });

      if ((latestPlan?.id ?? null) !== expectedCurrentPlanId) {
        throw new GoalChangeWorkflowError(
          "Nutrition plan has changed since the goal was loaded",
        );
      }

      if (latestPlan && latestPlan.goal !== toPrismaGoal(expectedCurrentGoal)) {
        throw new GoalChangeWorkflowError(
          "Nutrition plan goal does not match the current profile goal",
        );
      }

      const updated = await tx.profile.updateMany({
        where: {
          userId,
          goal: toPrismaGoal(expectedCurrentGoal),
        },
        data: {
          heightCm: profile.heightCm,
          age: profile.age,
          gender: toPrismaGender(profile.gender),
          activity: toPrismaActivity(profile.activity),
          goal: toPrismaGoal(profile.goal),
        },
      });

      if (updated.count !== 1) {
        throw new GoalChangeWorkflowError(
          "Goal changed since the profile was loaded",
        );
      }

      const nextPlan = await tx.nutritionPlan.create({
        data: {
          userId,
          version: (latestPlan?.version ?? 0) + 1,
          goal: toPrismaGoal(plan.goal),
          targetCalories: plan.targetCalories,
          proteinG: plan.proteinG,
          carbsG: plan.carbsG,
          fatG: plan.fatG,
        },
      });

      const savedProfile = await tx.profile.findUnique({
        where: { userId },
      });

      if (!savedProfile) {
        throw new GoalChangeWorkflowError(
          "Profile could not be loaded after goal change",
        );
      }

      return {
        profile: toDomainProfile(savedProfile),
        plan: toDomainPlan(nextPlan),
      };
    });
  }
}
