import { describe, expect, it, vi } from "vitest";
import { RespondToAdjustmentService } from "./respond-to-adjustment-service";
import type { ProgressEvaluationRepository } from "./repositories/progress-evaluation-repository";

const evaluation = {
  id: "evaluation-1",
  userId: "user-1",
  planVersionId: "plan-1",
  state: "PLATEAU" as const,
  changeKg: 0.1,
  entriesCount: 5,
  evaluationDays: 28,
  recommendedAction: "CONSIDER_ADJUSTMENT" as const,
  recommendationReason: "consecutive_problem" as const,
  adjustmentDecision: "PENDING" as const,
  respondedAt: null,
  evaluatedAt: "2026-09-05T10:00:00.000Z",
};

describe("RespondToAdjustmentService", () => {
  it("rejects a missing user ID", async () => {
    const repository = {} as ProgressEvaluationRepository;
    const service = new RespondToAdjustmentService(repository);

    await expect(
      service.execute("", {
        evaluationId: "evaluation-1",
        decision: "ACCEPTED",
      }),
    ).rejects.toThrow("User ID is required");
  });

  it("rejects a missing evaluation ID", async () => {
    const repository = {} as ProgressEvaluationRepository;
    const service = new RespondToAdjustmentService(repository);

    await expect(
      service.execute("user-1", {
        evaluationId: "",
        decision: "ACCEPTED",
      }),
    ).rejects.toThrow("Evaluation ID is required");
  });

  it("rejects an evaluation that cannot be found for the user", async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue(null),
    } as unknown as ProgressEvaluationRepository;

    const service = new RespondToAdjustmentService(repository);

    await expect(
      service.execute("user-1", {
        evaluationId: "evaluation-1",
        decision: "ACCEPTED",
      }),
    ).rejects.toThrow("Progress evaluation not found");

    expect(repository.respondToAdjustment).toBeUndefined();
  });

  it("rejects responses for non-adjustment recommendations", async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue({
        ...evaluation,
        recommendedAction: "REVIEW_ADHERENCE",
      }),
      respondToAdjustment: vi.fn(),
    } as unknown as ProgressEvaluationRepository;

    const service = new RespondToAdjustmentService(repository);

    await expect(
      service.execute("user-1", {
        evaluationId: "evaluation-1",
        decision: "DECLINED",
      }),
    ).rejects.toThrow("Adjustment response is not applicable");

    expect(repository.respondToAdjustment).not.toHaveBeenCalled();
  });

  it("rejects a decision that has already been recorded", async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue({
        ...evaluation,
        adjustmentDecision: "ACCEPTED",
      }),
      respondToAdjustment: vi.fn(),
    } as unknown as ProgressEvaluationRepository;

    const service = new RespondToAdjustmentService(repository);

    await expect(
      service.execute("user-1", {
        evaluationId: "evaluation-1",
        decision: "DECLINED",
      }),
    ).rejects.toThrow("Adjustment decision has already been recorded");

    expect(repository.respondToAdjustment).not.toHaveBeenCalled();
  });

  it("records an accepted adjustment decision", async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue(evaluation),
      respondToAdjustment: vi.fn().mockResolvedValue({
        ...evaluation,
        adjustmentDecision: "ACCEPTED",
        respondedAt: "2026-09-05T12:00:00.000Z",
      }),
    } as unknown as ProgressEvaluationRepository;

    const service = new RespondToAdjustmentService(repository);

    const result = await service.execute("user-1", {
      evaluationId: "evaluation-1",
      decision: "ACCEPTED",
    });

    expect(repository.respondToAdjustment).toHaveBeenCalledWith(
      "user-1",
      "evaluation-1",
      "ACCEPTED",
    );
    expect(result.adjustmentDecision).toBe("ACCEPTED");
  });

  it("records a declined adjustment decision", async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue(evaluation),
      respondToAdjustment: vi.fn().mockResolvedValue({
        ...evaluation,
        adjustmentDecision: "DECLINED",
        respondedAt: "2026-09-05T12:00:00.000Z",
      }),
    } as unknown as ProgressEvaluationRepository;

    const service = new RespondToAdjustmentService(repository);

    const result = await service.execute("user-1", {
      evaluationId: "evaluation-1",
      decision: "DECLINED",
    });

    expect(repository.respondToAdjustment).toHaveBeenCalledWith(
      "user-1",
      "evaluation-1",
      "DECLINED",
    );
    expect(result.adjustmentDecision).toBe("DECLINED");
  });
});
