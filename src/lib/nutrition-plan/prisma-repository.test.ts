import { randomUUID } from "node:crypto";
import { NutritionPlanConflictError } from "@/lib/nutrition-plan/errors";
import { CreateNutritionPlanService } from "@/lib/nutrition-plan/service";
import type { NutritionPlanRepository } from "@/lib/nutrition-plan/repository";
import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { prismaNutritionPlanRepository } from "@/lib/nutrition-plan/prisma-repository";

describe("prismaNutritionPlanRepository", () => {
  it("creates and retrieves plans for the correct user", async () => {
    const user = await prisma.user.create({
      data: {
        email: `nutrition-plan-${Date.now()}@example.com`,
        passwordHash: "test",
      },
    });

    const plan = await prismaNutritionPlanRepository.create(user.id, {
      version: 1,
      goal: "lose",
      targetCalories: 2000,
      proteinG: 150,
      carbsG: 225,
      fatG: 56,
    });

    const latest = await prismaNutritionPlanRepository.findLatestByUserId(
      user.id
    );

    expect(latest).toMatchObject({
      id: plan.id,
      version: 1,
      goal: "lose",
      targetCalories: 2000,
      proteinG: 150,
      carbsG: 225,
      fatG: 56,
    });

    await prisma.user.delete({ where: { id: user.id } });
  });

  it("returns the highest version as the latest plan", async () => {
    const user = await prisma.user.create({
      data: {
        email: `nutrition-plan-version-${Date.now()}@example.com`,
        passwordHash: "test",
      },
    });

    await prismaNutritionPlanRepository.create(user.id, {
      version: 1,
      goal: "lose",
      targetCalories: 2000,
      proteinG: 150,
      carbsG: 225,
      fatG: 56,
    });

    await prismaNutritionPlanRepository.create(user.id, {
      version: 2,
      goal: "maintain",
      targetCalories: 2200,
      proteinG: 138,
      carbsG: 275,
      fatG: 61,
    });

    const latest = await prismaNutritionPlanRepository.findLatestByUserId(
      user.id
    );

    expect(latest?.version).toBe(2);
    expect(latest?.goal).toBe("maintain");

    await prisma.user.delete({ where: { id: user.id } });
  });

  it("does not return another user's plans", async () => {
    const userA = await prisma.user.create({
      data: {
        email: `nutrition-plan-a-${Date.now()}@example.com`,
        passwordHash: "test",
      },
    });

    const userB = await prisma.user.create({
      data: {
        email: `nutrition-plan-b-${Date.now()}@example.com`,
        passwordHash: "test",
      },
    });

    await prismaNutritionPlanRepository.create(userA.id, {
      version: 1,
      goal: "gain",
      targetCalories: 2500,
      proteinG: 125,
      carbsG: 313,
      fatG: 69,
    });

    const plansForB =
      await prismaNutritionPlanRepository.findAllByUserId(userB.id);

    expect(plansForB).toEqual([]);

    await prisma.user.delete({ where: { id: userA.id } });
    await prisma.user.delete({ where: { id: userB.id } });
  });
  it("preserves version uniqueness and reports a conflict for concurrent creation", async () => {
    const user = await prisma.user.create({
      data: { email: `nutrition-plan-concurrent-${randomUUID()}@example.com`, passwordHash: "test" },
    });

    try {
      const input = {
        goal: "maintain" as const,
        targetCalories: 2200,
        proteinG: 138,
        carbsG: 275,
        fatG: 61,
      };
      await prismaNutritionPlanRepository.create(user.id, { ...input, version: 1 });

      // Both requests must read version 1 before either may insert version 2.
      let arrivals = 0;
      let release!: () => void;
      const bothRead = new Promise<void>((resolve) => { release = resolve; });
      const racingRepository: NutritionPlanRepository = {
        ...prismaNutritionPlanRepository,
        async findLatestByUserId(userId) {
          const latest = await prismaNutritionPlanRepository.findLatestByUserId(userId);
          arrivals += 1;
          if (arrivals === 2) release();
          await bothRead;
          return latest;
        },
      };
      const service = new CreateNutritionPlanService(racingRepository);
      const results = await Promise.allSettled([
        service.execute(user.id, input),
        service.execute(user.id, input),
      ]);

      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      const failures = results.filter((result) => result.status === "rejected");
      expect(failures).toHaveLength(1);
      expect(failures[0].reason).toBeInstanceOf(NutritionPlanConflictError);
      const history = await prismaNutritionPlanRepository.findAllByUserId(user.id);
      expect(history.map((plan) => plan.version)).toEqual([2, 1]);

      // A fresh, explicit request reads the winning version and can proceed.
      const retry = await new CreateNutritionPlanService(prismaNutritionPlanRepository)
        .execute(user.id, input);
      expect(retry.version).toBe(3);
    } finally {
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

});
