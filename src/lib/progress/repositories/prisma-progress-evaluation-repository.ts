import type { PrismaClient } from "@prisma/client";
import type {
  PersistedProgressEvaluation,
  NewProgressEvaluation,
  ProgressEvaluationRepository,
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
