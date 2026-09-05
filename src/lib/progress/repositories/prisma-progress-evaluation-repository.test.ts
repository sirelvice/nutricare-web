import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { PrismaProgressEvaluationRepository } from "./prisma-progress-evaluation-repository";

const TEST_PASSWORD_HASH =
  "$2b$10$7EqJtq98hPqEX7fNZaFWoO5V8KzAq5hLq1L9nG4g6Jj6o2Kf8xQ5K";

describe("PrismaProgressEvaluationRepository", () => {
  const repository = new PrismaProgressEvaluationRepository(prisma);

  beforeEach(async () => {
    await prisma.progressEvaluation.deleteMany({});
    await prisma.nutritionPlan.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: "progress-repository-",
        },
      },
    });
  });

  it("creates and retrieves evaluations for the correct user", async () => {
    const user = await prisma.user.create({
      data: {
        email: `progress-repository-${Date.now()}@example.com`,
        passwordHash: TEST_PASSWORD_HASH,
      },
    });

    const plan = await prisma.nutritionPlan.create({
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

    const created = await repository.create(user.id, {
      planVersionId: plan.id,
      state: "PLATEAU",
      changeKg: 0.2,
      entriesCount: 4,
      evaluationDays: 21,
      recommendedAction: "REVIEW_ADHERENCE",
      recommendationReason: "first_problem",
      evaluatedAt: "2026-09-15T12:00:00.000Z",
    });

    expect(created).toMatchObject({
      userId: user.id,
      planVersionId: plan.id,
      state: "PLATEAU",
      changeKg: 0.2,
      entriesCount: 4,
      evaluationDays: 21,
      recommendedAction: "REVIEW_ADHERENCE",
      recommendationReason: "first_problem",
      evaluatedAt: "2026-09-15T12:00:00.000Z",
    });

    const evaluations = await repository.findByUserId(user.id);

    expect(evaluations).toHaveLength(1);
    expect(evaluations[0]).toMatchObject(created);
  });

  it("does not return another user's evaluations", async () => {
    const userA = await prisma.user.create({
      data: {
        email: `progress-repository-${Date.now()}-a@example.com`,
        passwordHash: TEST_PASSWORD_HASH,
      },
    });

    const userB = await prisma.user.create({
      data: {
        email: `progress-repository-${Date.now()}-b@example.com`,
        passwordHash: TEST_PASSWORD_HASH,
      },
    });

    const planA = await prisma.nutritionPlan.create({
      data: {
        userId: userA.id,
        version: 1,
        goal: "LOSE",
        targetCalories: 2000,
        proteinG: 150,
        carbsG: 225,
        fatG: 56,
      },
    });

    const planB = await prisma.nutritionPlan.create({
      data: {
        userId: userB.id,
        version: 1,
        goal: "GAIN",
        targetCalories: 2500,
        proteinG: 150,
        carbsG: 300,
        fatG: 70,
      },
    });

    await repository.create(userA.id, {
      planVersionId: planA.id,
      state: "PLATEAU",
      changeKg: 0.1,
      entriesCount: 3,
      evaluationDays: 14,
      recommendedAction: "REVIEW_ADHERENCE",
      recommendationReason: "first_problem",
      evaluatedAt: "2026-09-15T12:00:00.000Z",
    });

    await repository.create(userB.id, {
      planVersionId: planB.id,
      state: "ON_TRACK",
      changeKg: 0.7,
      entriesCount: 4,
      evaluationDays: 21,
      recommendedAction: "CONTINUE",
      recommendationReason: "on_track",
      evaluatedAt: "2026-09-16T12:00:00.000Z",
    });

    const evaluations = await repository.findByUserId(userA.id);

    expect(evaluations).toHaveLength(1);
    expect(evaluations[0].userId).toBe(userA.id);
  });

  it("filters evaluations by user and plan version", async () => {
    const user = await prisma.user.create({
      data: {
        email: `progress-repository-${Date.now()}@example.com`,
        passwordHash: TEST_PASSWORD_HASH,
      },
    });

    const plan1 = await prisma.nutritionPlan.create({
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

    const plan2 = await prisma.nutritionPlan.create({
      data: {
        userId: user.id,
        version: 2,
        goal: "LOSE",
        targetCalories: 1900,
        proteinG: 145,
        carbsG: 210,
        fatG: 55,
      },
    });

    await repository.create(user.id, {
      planVersionId: plan1.id,
      state: "PLATEAU",
      changeKg: 0.1,
      entriesCount: 3,
      evaluationDays: 14,
      recommendedAction: "REVIEW_ADHERENCE",
      recommendationReason: "first_problem",
      evaluatedAt: "2026-09-15T12:00:00.000Z",
    });

    await repository.create(user.id, {
      planVersionId: plan2.id,
      state: "BEHIND_OPPOSITE",
      changeKg: 0.8,
      entriesCount: 4,
      evaluationDays: 21,
      recommendedAction: "REVIEW_ADHERENCE",
      recommendationReason: "first_problem",
      evaluatedAt: "2026-10-01T12:00:00.000Z",
    });

    const evaluations = await repository.findByPlanVersionId(
      user.id,
      plan2.id,
    );

    expect(evaluations).toHaveLength(1);
    expect(evaluations[0].planVersionId).toBe(plan2.id);
    expect(evaluations[0].state).toBe("BEHIND_OPPOSITE");
  });

  it("returns the latest evaluation by evaluatedAt", async () => {
    const user = await prisma.user.create({
      data: {
        email: `progress-repository-${Date.now()}@example.com`,
        passwordHash: TEST_PASSWORD_HASH,
      },
    });

    const plan = await prisma.nutritionPlan.create({
      data: {
        userId: user.id,
        version: 1,
        goal: "MAINTAIN",
        targetCalories: 2200,
        proteinG: 140,
        carbsG: 250,
        fatG: 61,
      },
    });

    await repository.create(user.id, {
      planVersionId: plan.id,
      state: "PLATEAU",
      changeKg: 0.1,
      entriesCount: 3,
      evaluationDays: 14,
      recommendedAction: "REVIEW_ADHERENCE",
      recommendationReason: "first_problem",
      evaluatedAt: "2026-09-15T12:00:00.000Z",
    });

    const latest = await repository.create(user.id, {
      planVersionId: plan.id,
      state: "ON_TRACK",
      changeKg: 0,
      entriesCount: 5,
      evaluationDays: 28,
      recommendedAction: "CONTINUE",
      recommendationReason: "on_track",
      evaluatedAt: "2026-10-01T12:00:00.000Z",
    });

    await expect(repository.findLatestByUserId(user.id)).resolves.toMatchObject(
      latest,
    );
  });


  it("returns the latest evaluation for a specific user and plan version", async () => {
    const user = await prisma.user.create({
      data: {
        email: `progress-repository-${Date.now()}-latest-plan@example.com`,
        passwordHash: TEST_PASSWORD_HASH,
      },
    });

    const plan1 = await prisma.nutritionPlan.create({
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

    const plan2 = await prisma.nutritionPlan.create({
      data: {
        userId: user.id,
        version: 2,
        goal: "LOSE",
        targetCalories: 1950,
        proteinG: 145,
        carbsG: 220,
        fatG: 55,
      },
    });

    await repository.create(user.id, {
      planVersionId: plan1.id,
      state: "PLATEAU",
      changeKg: 0.1,
      entriesCount: 3,
      evaluationDays: 14,
      recommendedAction: "REVIEW_ADHERENCE",
      recommendationReason: "first_problem",
      evaluatedAt: "2026-09-15T12:00:00.000Z",
    });

    await repository.create(user.id, {
      planVersionId: plan2.id,
      state: "PLATEAU",
      changeKg: 0.2,
      entriesCount: 4,
      evaluationDays: 21,
      recommendedAction: "CONSIDER_ADJUSTMENT",
      recommendationReason: "consecutive_problem",
      evaluatedAt: "2026-10-01T12:00:00.000Z",
    });

    const latest = await repository.findLatestByPlanVersionId(
      user.id,
      plan2.id,
    );

    expect(latest).toMatchObject({
      planVersionId: plan2.id,
      state: "PLATEAU",
      recommendedAction: "CONSIDER_ADJUSTMENT",
      recommendationReason: "consecutive_problem",
    });
  });

  it("records an accepted adjustment decision", async () => {
    const user = await prisma.user.create({
      data: {
        email: `progress-repository-${Date.now()}-accept@example.com`,
        passwordHash: TEST_PASSWORD_HASH,
      },
    });

    const plan = await prisma.nutritionPlan.create({
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

    const created = await repository.create(user.id, {
      planVersionId: plan.id,
      state: "PLATEAU",
      changeKg: 0.1,
      entriesCount: 5,
      evaluationDays: 28,
      recommendedAction: "CONSIDER_ADJUSTMENT",
      recommendationReason: "consecutive_problem",
      evaluatedAt: "2026-09-15T12:00:00.000Z",
    });

    const respondedAt = "2026-09-16T12:00:00.000Z";

    const updated = await repository.respondToAdjustment(
      user.id,
      created.id,
      "ACCEPTED",
      respondedAt,
    );

    expect(updated).toMatchObject({
      id: created.id,
      adjustmentDecision: "ACCEPTED",
      respondedAt,
    });
  });

  it("records a declined adjustment decision", async () => {
    const user = await prisma.user.create({
      data: {
        email: `progress-repository-${Date.now()}-decline@example.com`,
        passwordHash: TEST_PASSWORD_HASH,
      },
    });

    const plan = await prisma.nutritionPlan.create({
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

    const created = await repository.create(user.id, {
      planVersionId: plan.id,
      state: "PLATEAU",
      changeKg: 0.1,
      entriesCount: 5,
      evaluationDays: 28,
      recommendedAction: "CONSIDER_ADJUSTMENT",
      recommendationReason: "consecutive_problem",
      evaluatedAt: "2026-09-15T12:00:00.000Z",
    });

    const updated = await repository.respondToAdjustment(
      user.id,
      created.id,
      "DECLINED",
    );

    expect(updated.adjustmentDecision).toBe("DECLINED");
    expect(updated.respondedAt).toBeTruthy();
  });

  it("does not allow one user to respond to another user's evaluation", async () => {
    const userA = await prisma.user.create({
      data: {
        email: `progress-repository-${Date.now()}-owner@example.com`,
        passwordHash: TEST_PASSWORD_HASH,
      },
    });

    const userB = await prisma.user.create({
      data: {
        email: `progress-repository-${Date.now()}-other@example.com`,
        passwordHash: TEST_PASSWORD_HASH,
      },
    });

    const plan = await prisma.nutritionPlan.create({
      data: {
        userId: userA.id,
        version: 1,
        goal: "LOSE",
        targetCalories: 2000,
        proteinG: 150,
        carbsG: 225,
        fatG: 56,
      },
    });

    const created = await repository.create(userA.id, {
      planVersionId: plan.id,
      state: "PLATEAU",
      changeKg: 0.1,
      entriesCount: 5,
      evaluationDays: 28,
      recommendedAction: "CONSIDER_ADJUSTMENT",
      recommendationReason: "consecutive_problem",
      evaluatedAt: "2026-09-15T12:00:00.000Z",
    });

    await expect(
      repository.respondToAdjustment(
        userB.id,
        created.id,
        "ACCEPTED",
      ),
    ).rejects.toThrow("Progress evaluation cannot be responded to");

    const unchanged = await prisma.progressEvaluation.findUnique({
      where: { id: created.id },
    });

    expect(unchanged?.adjustmentDecision).toBe("PENDING");
    expect(unchanged?.respondedAt).toBeNull();
  });

  it("does not allow an adjustment decision to be changed after responding", async () => {
    const user = await prisma.user.create({
      data: {
        email: `progress-repository-${Date.now()}-once@example.com`,
        passwordHash: TEST_PASSWORD_HASH,
      },
    });

    const plan = await prisma.nutritionPlan.create({
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

    const created = await repository.create(user.id, {
      planVersionId: plan.id,
      state: "PLATEAU",
      changeKg: 0.1,
      entriesCount: 5,
      evaluationDays: 28,
      recommendedAction: "CONSIDER_ADJUSTMENT",
      recommendationReason: "consecutive_problem",
      evaluatedAt: "2026-09-15T12:00:00.000Z",
    });

    await repository.respondToAdjustment(user.id, created.id, "ACCEPTED");

    await expect(
      repository.respondToAdjustment(user.id, created.id, "DECLINED"),
    ).rejects.toThrow("Progress evaluation cannot be responded to");

    const unchanged = await prisma.progressEvaluation.findUnique({
      where: { id: created.id },
    });

    expect(unchanged?.adjustmentDecision).toBe("ACCEPTED");
  });

  it("preserves nullable evaluation fields", async () => {
    const user = await prisma.user.create({
      data: {
        email: `progress-repository-${Date.now()}@example.com`,
        passwordHash: TEST_PASSWORD_HASH,
      },
    });

    const plan = await prisma.nutritionPlan.create({
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

    const created = await repository.create(user.id, {
      planVersionId: plan.id,
      state: "INSUFFICIENT_DATA",
      changeKg: null,
      entriesCount: 2,
      evaluationDays: null,
      recommendedAction: "CONTINUE",
      recommendationReason: "insufficient_data",
    });

    expect(created.changeKg).toBeNull();
    expect(created.evaluationDays).toBeNull();
    expect(created.evaluatedAt).toBeTruthy();
  });
});
