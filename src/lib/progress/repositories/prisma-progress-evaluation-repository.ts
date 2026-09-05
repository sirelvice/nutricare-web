import type { PrismaClient } from "@prisma/client";
import type {
  PersistedProgressEvaluation,
  NewProgressEvaluation,
  ProgressEvaluationRepository,
  AdjustmentDecision,
} from "./progress-evaluation-repository";

type PrismaProgressEvaluation = {
  id: string;
  userId: string;
  planVersionId: string;
  state:
    | "ON_TRACK"
    | "BEHIND_OPPOSITE"
    | "PLATEAU"
    | "INSUFFICIENT_DATA";
  changeKg: number | null;
  entriesCount: number;
  evaluationDays: number | null;
  recommendedAction:
    | "CONTINUE"
    | "REVIEW_ADHERENCE"
    | "CONSIDER_ADJUSTMENT"
    | "SUGGEST_PROFESSIONAL_CONSULT";
  recommendationReason:
    | "INSUFFICIENT_DATA"
    | "ON_TRACK"
    | "FIRST_PROBLEM"
    | "CONSECUTIVE_PROBLEM"
    | "RECURRENCE_AFTER_ADJUSTMENT";
  adjustmentDecision: AdjustmentDecision;
  respondedAt: Date | null;
  evaluatedAt: Date;
};

function toDomain(
  evaluation: PrismaProgressEvaluation,
): PersistedProgressEvaluation {
  return {
    id: evaluation.id,
    userId: evaluation.userId,
    planVersionId: evaluation.planVersionId,
    state: evaluation.state,
    changeKg: evaluation.changeKg,
    entriesCount: evaluation.entriesCount,
    evaluationDays: evaluation.evaluationDays,
    recommendedAction: evaluation.recommendedAction,
    recommendationReason:
      evaluation.recommendationReason.toLowerCase() as
        | "insufficient_data"
        | "on_track"
        | "first_problem"
        | "consecutive_problem"
        | "recurrence_after_adjustment",
    adjustmentDecision: evaluation.adjustmentDecision,
    respondedAt: evaluation.respondedAt?.toISOString() ?? null,
    evaluatedAt: evaluation.evaluatedAt.toISOString(),
  };
}

export class PrismaProgressEvaluationRepository
  implements ProgressEvaluationRepository
{
  constructor(private readonly db: PrismaClient) {}

  async create(
    userId: string,
    evaluation: NewProgressEvaluation,
  ): Promise<PersistedProgressEvaluation> {
    const created = await this.db.progressEvaluation.create({
      data: {
        userId,
        planVersionId: evaluation.planVersionId,
        state: evaluation.state,
        changeKg: evaluation.changeKg,
        entriesCount: evaluation.entriesCount,
        evaluationDays: evaluation.evaluationDays,
        recommendedAction: evaluation.recommendedAction,
        recommendationReason:
          evaluation.recommendationReason.toUpperCase() as
            | "INSUFFICIENT_DATA"
            | "ON_TRACK"
            | "FIRST_PROBLEM"
            | "CONSECUTIVE_PROBLEM"
            | "RECURRENCE_AFTER_ADJUSTMENT",
        adjustmentDecision: "PENDING",
        ...(evaluation.evaluatedAt
          ? { evaluatedAt: new Date(evaluation.evaluatedAt) }
          : {}),
      },
    });

    return toDomain(created);
  }

  async findByUserId(
    userId: string,
  ): Promise<PersistedProgressEvaluation[]> {
    const evaluations = await this.db.progressEvaluation.findMany({
      where: { userId },
      orderBy: { evaluatedAt: "desc" },
    });

    return evaluations.map(toDomain);
  }

  async findByPlanVersionId(
    userId: string,
    planVersionId: string,
  ): Promise<PersistedProgressEvaluation[]> {
    const evaluations = await this.db.progressEvaluation.findMany({
      where: {
        userId,
        planVersionId,
      },
      orderBy: { evaluatedAt: "desc" },
    });

    return evaluations.map(toDomain);
  }

  async findLatestByPlanVersionId(
    userId: string,
    planVersionId: string,
  ): Promise<PersistedProgressEvaluation | null> {
    const evaluation = await this.db.progressEvaluation.findFirst({
      where: {
        userId,
        planVersionId,
      },
      orderBy: { evaluatedAt: "desc" },
    });

    return evaluation ? toDomain(evaluation) : null;
  }

  async respondToAdjustment(
    userId: string,
    evaluationId: string,
    decision: Exclude<AdjustmentDecision, "PENDING">,
    respondedAt?: string,
  ): Promise<PersistedProgressEvaluation> {
    const updated = await this.db.progressEvaluation.updateMany({
      where: {
        id: evaluationId,
        userId,
        adjustmentDecision: "PENDING",
      },
      data: {
        adjustmentDecision: decision,
        respondedAt: respondedAt ? new Date(respondedAt) : new Date(),
      },
    });

    if (updated.count !== 1) {
      throw new Error("Progress evaluation cannot be responded to");
    }

    const evaluation = await this.db.progressEvaluation.findUnique({
      where: { id: evaluationId },
    });

    if (!evaluation) {
      throw new Error("Progress evaluation not found");
    }

    return toDomain(evaluation);
  }

  async findLatestByUserId(
    userId: string,
  ): Promise<PersistedProgressEvaluation | null> {
    const evaluation = await this.db.progressEvaluation.findFirst({
      where: { userId },
      orderBy: { evaluatedAt: "desc" },
    });

    return evaluation ? toDomain(evaluation) : null;
  }
}
