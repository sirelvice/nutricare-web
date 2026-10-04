import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { PrismaGoalChangeWorkflowRepository } from "./goal-change-workflow-repository";

describe("goal change workflow integration", () => {
  let userId: string | null = null;

  afterEach(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
      userId = null;
    }
  });

  it("changes the active goal, creates the next plan, and preserves history", async () => {
    const user = await prisma.user.create({
      data: {
        email: `goal-change-${Date.now()}@example.com`,
        passwordHash: "test",
        profile: {
          create: {
            heightCm: 170,
            age: 30,
            gender: "MALE",
            activity: "MODERATE",
            goal: "LOSE",
          },
        },
      },
    });

    userId = user.id;

    const oldPlan = await prisma.nutritionPlan.create({
      data: {
        userId: user.id,
        version: 1,
        goal: "LOSE",
        targetCalories: 2053,
        proteinG: 154,
        carbsG: 231,
        fatG: 57,
      },
    });

    const oldEvaluation = await prisma.progressEvaluation.create({
      data: {
        userId: user.id,
        planVersionId: oldPlan.id,
        state: "PLATEAU",
        changeKg: 0.1,
        entriesCount: 5,
        evaluationDays: 28,
        recommendedAction: "REVIEW_ADHERENCE",
        recommendationReason: "FIRST_PROBLEM",
      },
    });

    const repository = new PrismaGoalChangeWorkflowRepository(prisma);

    const result = await repository.changeGoal(
      user.id,
      "lose",
      oldPlan.id,
      {
        heightCm: 170,
        age: 30,
        gender: "male",
        activity: "moderate",
        goal: "gain",
      },
      {
        goal: "gain",
        targetCalories: 2603,
        proteinG: 163,
        carbsG: 325,
        fatG: 72,
      },
    );

    expect(result.profile.goal).toBe("gain");
    expect(result.plan.version).toBe(2);
    expect(result.plan.goal).toBe("gain");

    const persistedProfile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    expect(persistedProfile?.goal).toBe("GAIN");

    const plans = await prisma.nutritionPlan.findMany({
      where: { userId: user.id },
      orderBy: { version: "asc" },
    });

    expect(plans).toHaveLength(2);
    expect(plans[0]).toMatchObject({
      id: oldPlan.id,
      version: 1,
      goal: "LOSE",
    });
    expect(plans[1]).toMatchObject({
      id: result.plan.id,
      version: 2,
      goal: "GAIN",
    });

    const evaluations = await prisma.progressEvaluation.findMany({
      where: { userId: user.id },
    });

    expect(evaluations).toHaveLength(1);
    expect(evaluations[0].id).toBe(oldEvaluation.id);
    expect(evaluations[0].planVersionId).toBe(oldPlan.id);

    const latestPlan = await prisma.nutritionPlan.findFirst({
      where: { userId: user.id },
      orderBy: { version: "desc" },
    });

    expect(latestPlan?.id).toBe(result.plan.id);
    expect(latestPlan?.goal).toBe("GAIN");
  });

  it("rejects a stale current plan without changing the profile", async () => {
    const user = await prisma.user.create({
      data: {
        email: `goal-change-stale-${Date.now()}@example.com`,
        passwordHash: "test",
        profile: {
          create: {
            heightCm: 170,
            age: 30,
            gender: "MALE",
            activity: "MODERATE",
            goal: "LOSE",
          },
        },
      },
    });

    userId = user.id;

    await prisma.nutritionPlan.create({
      data: {
        userId: user.id,
        version: 1,
        goal: "LOSE",
        targetCalories: 2053,
        proteinG: 154,
        carbsG: 231,
        fatG: 57,
      },
    });

    const latestPlan = await prisma.nutritionPlan.create({
      data: {
        userId: user.id,
        version: 2,
        goal: "LOSE",
        targetCalories: 2100,
        proteinG: 155,
        carbsG: 230,
        fatG: 60,
      },
    });

    const repository = new PrismaGoalChangeWorkflowRepository(prisma);

    await expect(
      repository.changeGoal(
        user.id,
        "lose",
        "stale-plan-id",
        {
          heightCm: 170,
          age: 30,
          gender: "male",
          activity: "moderate",
          goal: "gain",
        },
        {
          goal: "gain",
          targetCalories: 2603,
          proteinG: 163,
          carbsG: 325,
          fatG: 72,
        },
      ),
    ).rejects.toThrow(
      "Nutrition plan has changed since the goal was loaded",
    );

    const persistedProfile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    expect(persistedProfile?.goal).toBe("LOSE");

    const plans = await prisma.nutritionPlan.findMany({
      where: { userId: user.id },
      orderBy: { version: "asc" },
    });

    expect(plans).toHaveLength(2);
    expect(plans[1].id).toBe(latestPlan.id);
    expect(plans[1].goal).toBe("LOSE");
  });
});
