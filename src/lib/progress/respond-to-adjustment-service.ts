import type {
  AdjustmentDecision,
  PersistedProgressEvaluation,
  ProgressEvaluationRepository,
} from "./repositories/progress-evaluation-repository";

export type RespondToAdjustmentInput = {
  evaluationId: string;
  decision: Exclude<AdjustmentDecision, "PENDING">;
};

export class RespondToAdjustmentService {
  constructor(
    private readonly evaluationRepository: ProgressEvaluationRepository,
  ) {}

  async execute(
    userId: string,
    input: RespondToAdjustmentInput,
  ): Promise<PersistedProgressEvaluation> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!input.evaluationId) {
      throw new Error("Evaluation ID is required");
    }

    if (input.decision !== "ACCEPTED" && input.decision !== "DECLINED") {
      throw new Error("Invalid adjustment decision");
    }

    const evaluation = await this.evaluationRepository.findLatestByUserId(
      userId,
    );

    if (!evaluation || evaluation.id !== input.evaluationId) {
      throw new Error("Progress evaluation not found");
    }

    if (evaluation.recommendedAction !== "CONSIDER_ADJUSTMENT") {
      throw new Error("Adjustment response is not applicable");
    }

    if (evaluation.adjustmentDecision !== "PENDING") {
      throw new Error("Adjustment decision has already been recorded");
    }

    return this.evaluationRepository.respondToAdjustment(
      userId,
      input.evaluationId,
      input.decision,
    );
  }
}
