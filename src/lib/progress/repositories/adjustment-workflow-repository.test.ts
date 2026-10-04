import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  AdjustmentWorkflowError,
  PrismaAdjustmentWorkflowRepository,
} from "./adjustment-workflow-repository";

const TEST_PASSWORD_HASH = "test";

async function createUser(suffix: string) {
  return prisma.user.create({
    data: {
      email: `adjustment-workflow-${suffix}-${Date.now()}@example.com`,
      passwordHash: TEST_PASSWORD_HASH,
    },
  });
}

describe("PrismaAdjustmentWorkflowRepository", () => {
  const repository = new PrismaAdjustmentWorkflowRepository(prisma);

  it("creates the next plan version and accepts the evaluation atomically", async () => {
    const user = await createUser("success");

    const currentPlan = await prisma.nutritionPlan.create({
      data: {
        userId: user.id,
        version: 1,
        goal: "LOSE",
        targetCalories: 2000,
        proteinG: 150,
        carbsG: 225,
        fatG: 56,
      },
    });

    const evaluation = await prisma.progressEvaluation.create({
      data: {
        userId: user.id,
        planVersionId: currentPlan.id,
        state: "PLATEAU",
        changeKg: 0.1,
        entriesCount: 5,
        evaluationDays: 28,
        recommendedAction: "CONSIDER_ADJUSTMENT",
        recommendationReason: "CONSECUTIVE_PROBLEM",
        adjustmentDecision: "PENDING",
      },
    });

    const persistedEvaluation = await prisma.progressEvaluation.findUnique({
      where: { id: evaluation.id },
    });

    expect(persistedEvaluation).toMatchObject({
      id: evaluation.id,
      userId: user.id,
      planVersionId: currentPlan.id,
      recommendedAction: "CONSIDER_ADJUSTMENT",
      adjustmentDecision: "PENDING",
    });

    const result = await repository.applyAcceptedAdjustment(
      user.id,
      evaluation.id,
      currentPlan.id,
      {
        goal: "lose",
        targetCalories: 1850,
        proteinG: 150,
        carbsG: 190,
        fatG: 55,
      },
    );

    expect(result.adjustmentDecision).toBe("ACCEPTED");
    expect(result.plan.version).toBe(2);
    expect(result.plan.targetCalories).toBe(1850);

    const savedEvaluation = await prisma.progressEvaluation.findUnique({
      where: { id: evaluation.id },
    });

    expect(savedEvaluation?.adjustmentDecision).toBe("ACCEPTED");
    expect(savedEvaluation?.respondedAt).not.toBeNull();

    const plans = await prisma.nutritionPlan.findMany({
      where: { userId: user.id },
      orderBy: { version: "asc" },
    });

    expect(plans).toHaveLength(2);
    expect(plans[1].version).toBe(2);

    await prisma.user.delete({ where: { id: user.id } });
  });

  it("rejects a recommendation from a stale plan version", async () => {
    const user = await createUser("stale");

    const oldPlan = await prisma.nutritionPlan.create({
      data: {
        userId: user.id,
        version: 1,
        goal: "LOSE",
        targetCalories: 2000,
        proteinG: 150,
        carbsG: 225,
        fatG: 56,
      },
    });

    const currentPlan = await prisma.nutritionPlan.create({
      data: {
        userId: user.id,
        version: 2,
        goal: "LOSE",
        targetCalories: 1900,
        proteinG: 145,
        carbsG: 210,
        fatG: 53,
      },
    });

    const evaluation = await prisma.progressEvaluation.create({
      data: {
        userId: user.id,
        planVersionId: oldPlan.id,
        state: "PLATEAU",
        changeKg: 0.1,
        entriesCount: 5,
        evaluationDays: 28,
        recommendedAction: "CONSIDER_ADJUSTMENT",
        recommendationReason: "CONSECUTIVE_PROBLEM",
        adjustmentDecision: "PENDING",
      },
    });

    await expect(
      repository.applyAcceptedAdjustment(
        user.id,
        evaluation.id,
        oldPlan.id,
        {
          goal: "lose",
          targetCalories: 1800,
          proteinG: 145,
          carbsG: 185,
          fatG: 53,
        },
      ),
    ).rejects.toBeInstanceOf(AdjustmentWorkflowError);

    const savedEvaluation = await prisma.progressEvaluation.findUnique({
      where: { id: evaluation.id },
    });

    expect(savedEvaluation?.adjustmentDecision).toBe("PENDING");

    const plans = await prisma.nutritionPlan.findMany({
      where: { userId: user.id },
      orderBy: { version: "asc" },
    });

    expect(plans).toHaveLength(2);
    expect(plans.at(-1)?.id).toBe(currentPlan.id);

    await prisma.user.delete({ where: { id: user.id } });
  });

  it("does not allow another user to apply the adjustment", async () => {
    const owner = await createUser("owner");
    const attacker = await createUser("attacker");

    const plan = await prisma.nutritionPlan.create({
      data: {
        userId: owner.id,
        version: 1,
        goal: "GAIN",
        targetCalories: 2500,
        proteinG: 125,
        carbsG: 313,
        fatG: 69,
      },
    });

    const evaluation = await prisma.progressEvaluation.create({
      data: {
        userId: owner.id,
        planVersionId: plan.id,
        state: "PLATEAU",
        changeKg: 0.1,
        entriesCount: 5,
        evaluationDays: 28,
        recommendedAction: "CONSIDER_ADJUSTMENT",
        recommendationReason: "CONSECUTIVE_PROBLEM",
        adjustmentDecision: "PENDING",
      },
    });

    await expect(
      repository.applyAcceptedAdjustment(
        attacker.id,
        evaluation.id,
        plan.id,
        {
          goal: "gain",
          targetCalories: 2750,
          proteinG: 130,
          carbsG: 330,
          fatG: 70,
        },
      ),
    ).rejects.toBeInstanceOf(AdjustmentWorkflowError);

    const plans = await prisma.nutritionPlan.findMany({
      where: { userId: owner.id },
    });

    expect(plans).toHaveLength(1);

    await prisma.user.delete({ where: { id: owner.id } });
    await prisma.user.delete({ where: { id: attacker.id } });
  });
});
