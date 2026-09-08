import { describe, expect, it, vi } from "vitest";
import {
  GoalChangeWorkflowError,
  PrismaGoalChangeWorkflowRepository,
} from "./goal-change-workflow-repository";

const profile = {
  heightCm: 170,
  age: 30,
  gender: "MALE" as const,
  activity: "MODERATE" as const,
  goal: "LOSE" as const,
};

const plan = {
  goal: "gain" as const,
  targetCalories: 2603,
  proteinG: 163,
  carbsG: 260,
  fatG: 72,
};

describe("PrismaGoalChangeWorkflowRepository", () => {
  it("updates the profile and creates the next plan in one transaction", async () => {
    const tx = {
      profile: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUnique: vi.fn().mockResolvedValue({
          ...profile,
          goal: "GAIN",
        }),
      },
      nutritionPlan: {
        findFirst: vi.fn().mockResolvedValue({
          id: "plan-1",
          version: 1,
          goal: "LOSE",
          targetCalories: 2053,
          proteinG: 154,
          carbsG: 231,
          fatG: 57,
          createdAt: new Date("2026-09-03T00:00:00.000Z"),
        }),
        create: vi.fn().mockResolvedValue({
          id: "plan-2",
          version: 2,
          goal: "GAIN",
          targetCalories: 2603,
          proteinG: 163,
          carbsG: 260,
          fatG: 72,
          createdAt: new Date("2026-09-08T00:00:00.000Z"),
        }),
      },
    };

    const db = {
      $transaction: vi.fn(async (callback) => callback(tx)),
    };

    const repository = new PrismaGoalChangeWorkflowRepository(db as never);

    const result = await repository.changeGoal(
      "user-1",
      "lose",
      "plan-1",
      {
        heightCm: 170,
        age: 30,
        gender: "male",
        activity: "moderate",
        goal: "gain",
      },
      plan,
    );

    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.profile.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", goal: "LOSE" },
      data: {
        heightCm: 170,
        age: 30,
        gender: "MALE",
        activity: "MODERATE",
        goal: "GAIN",
      },
    });
    expect(tx.nutritionPlan.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        version: 2,
        goal: "GAIN",
        targetCalories: 2603,
        proteinG: 163,
        carbsG: 260,
        fatG: 72,
      },
    });

    expect(result.profile.goal).toBe("gain");
    expect(result.plan.version).toBe(2);
    expect(result.plan.goal).toBe("gain");
  });

  it("starts plan versioning at one when no prior plan exists", async () => {
    const tx = {
      profile: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUnique: vi.fn().mockResolvedValue({
          ...profile,
          goal: "GAIN",
        }),
      },
      nutritionPlan: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: "plan-1",
          version: 1,
          goal: "GAIN",
          targetCalories: 2603,
          proteinG: 163,
          carbsG: 260,
          fatG: 72,
          createdAt: new Date("2026-09-08T00:00:00.000Z"),
        }),
      },
    };

    const repository = new PrismaGoalChangeWorkflowRepository({
      $transaction: vi.fn(async (callback) => callback(tx)),
    } as never);

    const result = await repository.changeGoal(
      "user-1",
      "lose",
      null,
      {
        heightCm: 170,
        age: 30,
        gender: "male",
        activity: "moderate",
        goal: "gain",
      },
      plan,
    );

    expect(result.plan.version).toBe(1);
  });

  it("rejects a stale goal without creating a new plan", async () => {
    const tx = {
      profile: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        findUnique: vi.fn(),
      },
      nutritionPlan: {
        findFirst: vi.fn().mockResolvedValue({
          id: "plan-2",
          version: 2,
          goal: "GAIN",
          targetCalories: 2603,
          proteinG: 163,
          carbsG: 260,
          fatG: 72,
          createdAt: new Date("2026-09-08T00:00:00.000Z"),
        }),
        create: vi.fn(),
      },
    };

    const repository = new PrismaGoalChangeWorkflowRepository({
      $transaction: vi.fn(async (callback) => callback(tx)),
    } as never);

    await expect(
      repository.changeGoal(
        "user-1",
        "lose",
        "plan-2",
        {
          heightCm: 170,
          age: 30,
          gender: "male",
          activity: "moderate",
          goal: "gain",
        },
        plan,
      ),
    ).rejects.toThrow(GoalChangeWorkflowError);

    expect(tx.nutritionPlan.create).not.toHaveBeenCalled();
  });

  it("rejects when the expected current plan is stale", async () => {
    const tx = {
      profile: {
        updateMany: vi.fn(),
        findUnique: vi.fn(),
      },
      nutritionPlan: {
        findFirst: vi.fn().mockResolvedValue({
          id: "plan-3",
          version: 3,
          goal: "LOSE",
          targetCalories: 2053,
          proteinG: 154,
          carbsG: 231,
          fatG: 57,
          createdAt: new Date("2026-09-08T00:00:00.000Z"),
        }),
        create: vi.fn(),
      },
    };

    const repository = new PrismaGoalChangeWorkflowRepository({
      $transaction: vi.fn(async (callback) => callback(tx)),
    } as never);

    await expect(
      repository.changeGoal(
        "user-1",
        "lose",
        "plan-2",
        {
          heightCm: 170,
          age: 30,
          gender: "male",
          activity: "moderate",
          goal: "gain",
        },
        plan,
      ),
    ).rejects.toThrow(
      "Nutrition plan has changed since the goal was loaded",
    );

    expect(tx.profile.updateMany).not.toHaveBeenCalled();
    expect(tx.nutritionPlan.create).not.toHaveBeenCalled();
  });

});
