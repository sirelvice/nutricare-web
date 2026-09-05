import type { ProgressState } from "@/lib/progress/domain";
import type {
  RecommendedAction,
  RecommendationReason,
} from "@/lib/progress/recommendation";

export type PersistedProgressEvaluation = {
  id: string;
  userId: string;
  planVersionId: string;
  state: ProgressState;
  changeKg: number | null;
  entriesCount: number;
  evaluationDays: number | null;
  recommendedAction: RecommendedAction;
  recommendationReason: RecommendationReason;
  evaluatedAt: string;
};

export type NewProgressEvaluation = {
  planVersionId: string;
  state: ProgressState;
  changeKg: number | null;
  entriesCount: number;
  evaluationDays: number | null;
  recommendedAction: RecommendedAction;
  recommendationReason: RecommendationReason;
  evaluatedAt?: string;
};

export interface ProgressEvaluationRepository {
  create(
    userId: string,
    evaluation: NewProgressEvaluation,
  ): Promise<PersistedProgressEvaluation>;

  findByUserId(
    userId: string,
  ): Promise<PersistedProgressEvaluation[]>;

  findByPlanVersionId(
    userId: string,
    planVersionId: string,
  ): Promise<PersistedProgressEvaluation[]>;

  findLatestByPlanVersionId(
    userId: string,
    planVersionId: string,
  ): Promise<PersistedProgressEvaluation | null>;

  findLatestByUserId(
    userId: string,
  ): Promise<PersistedProgressEvaluation | null>;
}
