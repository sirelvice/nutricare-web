import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { EvaluateAndRecordProgressService } from "./evaluate-and-record-service";
import { PrismaAdjustmentWorkflowRepository } from "./repositories/adjustment-workflow-repository";
import { PrismaProgressEvaluationRepository } from "./repositories/prisma-progress-evaluation-repository";
import { PrismaProfileRepository } from "@/lib/profile/repositories/prisma-profile-repository";
import { PrismaWeightRepository } from "@/lib/tracking/repositories/prisma-weight-repository";
import { prismaNutritionPlanRepository } from "@/lib/nutrition-plan/prisma-repository";

describe("plan-period evaluation lifecycle", () => {
  let userId: string | null = null;

  afterEach(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
      userId = null;
    }
  });

  it("starts a fresh period after an accepted adjustment and escalates recurrence", async () => {
    const user = await prisma.user.create({
      data: {
        email: `evaluation-lifecycle-${Date.now()}@example.com`,
        passwordHash: "test",
        profile: {
          create: {
            heightCm: 176,
            age: 24,
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
        targetCalories: 2100,
        proteinG: 140,
        carbsG: 230,
        fatG: 70,
        createdAt: new Date("2026-08-01T00:00:00.000Z"),
      },
    });

    const previousEvaluation = await prisma.progressEvaluation.create({
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
        evaluatedAt: new Date("2026-09-29T12:00:00.000Z"),
      },
    });

    const workflowRepository = new PrismaAdjustmentWorkflowRepository(prisma);

    const applied = await workflowRepository.applyAcceptedAdjustment(
      user.id,
      previousEvaluation.id,
      oldPlan.id,
      {
        goal: "lose",
        targetCalories: 1950,
        proteinG: 145,
        carbsG: 210,
        fatG: 55,
      },
    );

    expect(applied.adjustmentDecision).toBe("ACCEPTED");
    expect(applied.plan.version).toBe(2);

    await prisma.weightEntry.createMany({
      data: [
        {
          userId: user.id,
          date: new Date("2026-08-15T00:00:00.000Z"),
          weightKg: 70,
        },
        {
          userId: user.id,
          date: new Date("2026-10-01T00:00:00.000Z"),
          weightKg: 70,
        },
        {
          userId: user.id,
          date: new Date("2026-10-08T00:00:00.000Z"),
          weightKg: 69.9,
        },
        {
          userId: user.id,
          date: new Date("2026-10-15T00:00:00.000Z"),
          weightKg: 69.8,
        },
      ],
    });

    const evaluationRepository =
      new PrismaProgressEvaluationRepository(prisma);

    const service = new EvaluateAndRecordProgressService(
      new PrismaProfileRepository(prisma),
      new PrismaWeightRepository(prisma),
      prismaNutritionPlanRepository,
      evaluationRepository,
    );

    const result = await service.execute(user.id);

    expect(result).not.toBeNull();
    expect(result?.evaluation).toMatchObject({
      state: "PLATEAU",
      changeKg: -0.2,
      entriesCount: 3,
      evaluationDays: 14,
    });
    expect(result?.recommendation).toEqual({
      recommendedAction: "SUGGEST_PROFESSIONAL_CONSULT",
      reason: "recurrence_after_adjustment",
    });

    const persisted = await evaluationRepository.findLatestByPlanVersionId(
      user.id,
      applied.plan.id,
    );

    expect(persisted).toMatchObject({
      planVersionId: applied.plan.id,
      state: "PLATEAU",
      recommendedAction: "SUGGEST_PROFESSIONAL_CONSULT",
      recommendationReason: "recurrence_after_adjustment",
    });

    expect(persisted?.entriesCount).toBe(3);
  });
});
