import { describe, expect, it, vi } from "vitest";
import { ChangeGoalService } from "./change-goal";
import type { UserProfile } from "../domain";

const profile: UserProfile = {
  heightCm: 170,
  age: 30,
  gender: "male",
  activity: "moderate",
  goal: "gain",
};

describe("ChangeGoalService", () => {
  it("requires a user ID", async () => {
    const service = new ChangeGoalService(
      {
          findLatestByUserId: vi.fn(),
          create: vi.fn(),
          findByUserId: vi.fn(),
          delete: vi.fn(),
        },
      {
        create: vi.fn(),
        findLatestByUserId: vi.fn(),
        findAllByUserId: vi.fn(),
      },
      { changeGoal: vi.fn() },
    );

    await expect(
      service.execute("", "lose", profile),
    ).rejects.toThrow("User ID is required");
  });

  it("requires a current weight", async () => {
    const weightRepository = {
      findLatestByUserId: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
        findByUserId: vi.fn(),
        delete: vi.fn(),
    };
    const workflowRepository = {
      changeGoal: vi.fn(),
    };

    const service = new ChangeGoalService(
      weightRepository,
      {
          create: vi.fn(),
          findLatestByUserId: vi.fn().mockResolvedValue(null),
          findAllByUserId: vi.fn(),
        },
      workflowRepository,
    );

    await expect(
      service.execute("user-1", "lose", profile),
    ).rejects.toThrow("Weight entry is required to change goal");

    expect(workflowRepository.changeGoal).not.toHaveBeenCalled();
  });

  it("requires enough profile data to calculate the new plan", async () => {
    const weightRepository = {
      findLatestByUserId: vi.fn().mockResolvedValue({
        id: "weight-1",
        date: "2026-09-03",
        weightKg: 60,
      }),
        create: vi.fn(),
        findByUserId: vi.fn(),
        delete: vi.fn(),
    };
    const workflowRepository = {
      changeGoal: vi.fn(),
    };

    const service = new ChangeGoalService(
      weightRepository,
      {
          create: vi.fn(),
          findLatestByUserId: vi.fn().mockResolvedValue(null),
          findAllByUserId: vi.fn(),
        },
      workflowRepository,
    );

    await expect(
      service.execute("user-1", "lose", {
        ...profile,
        heightCm: null,
      }),
    ).rejects.toThrow(
      "Unable to calculate nutrition plan for new goal",
    );

    expect(workflowRepository.changeGoal).not.toHaveBeenCalled();
  });

  it("calculates and applies the new goal", async () => {
    const weightRepository = {
      findLatestByUserId: vi.fn().mockResolvedValue({
        id: "weight-1",
        date: "2026-09-03",
        weightKg: 60,
      }),
        create: vi.fn(),
        findByUserId: vi.fn(),
        delete: vi.fn(),
    };
    const workflowRepository = {
      changeGoal: vi.fn().mockResolvedValue({
        profile,
        plan: {
          id: "plan-2",
          version: 2,
          goal: "gain",
          targetCalories: 2603,
          proteinG: 163,
          carbsG: 260,
          fatG: 72,
          createdAt: "2026-09-08T00:00:00.000Z",
        },
      }),
    };

    const service = new ChangeGoalService(
      weightRepository,
      {
          create: vi.fn(),
          findLatestByUserId: vi.fn().mockResolvedValue(null),
          findAllByUserId: vi.fn(),
        },
      workflowRepository,
    );

    await expect(
      service.execute("user-1", "lose", profile),
    ).resolves.toEqual(profile);

    expect(workflowRepository.changeGoal).toHaveBeenCalledWith(
      "user-1",
      "lose",
      null,
      profile,
      expect.objectContaining({
        goal: "gain",
        targetCalories: expect.any(Number),
        proteinG: expect.any(Number),
        carbsG: expect.any(Number),
        fatG: expect.any(Number),
      }),
    );
  });

  it("rejects when the current plan no longer matches the loaded goal", async () => {
    const weightRepository = {
      findLatestByUserId: vi.fn().mockResolvedValue({
        id: "weight-1",
        date: "2026-09-03",
        weightKg: 60,
      }),
        create: vi.fn(),
        findByUserId: vi.fn(),
        delete: vi.fn(),
    };

    const nutritionPlanRepository = {
      create: vi.fn(),
      findLatestByUserId: vi.fn().mockResolvedValue({
        id: "plan-2",
        version: 2,
        goal: "gain",
        targetCalories: 2603,
        proteinG: 163,
        carbsG: 260,
        fatG: 72,
        createdAt: "2026-09-08T00:00:00.000Z",
      }),
      findAllByUserId: vi.fn(),
    };

    const workflowRepository = {
      changeGoal: vi.fn(),
    };

    const service = new ChangeGoalService(
      weightRepository,
      nutritionPlanRepository,
      workflowRepository,
    );

    await expect(
      service.execute("user-1", "lose", {
        ...profile,
        goal: "gain",
      }),
    ).rejects.toThrow(
      "Nutrition plan has changed since the goal was loaded",
    );

    expect(workflowRepository.changeGoal).not.toHaveBeenCalled();
  });

});
