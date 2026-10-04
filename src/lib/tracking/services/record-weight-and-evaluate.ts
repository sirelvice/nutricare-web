import type { NutritionPlanRepository } from "@/lib/nutrition-plan/repository";
import type { ProgressEvaluationRepository } from "@/lib/progress/repositories/progress-evaluation-repository";
import { EvaluateAndRecordProgressService } from "@/lib/progress/evaluate-and-record-service";
import {
  type NewWeightEntry,
  type WeightEntry,
} from "../domain";
import { RecordWeightEntryService } from "./record-weight-entry";

export const PROGRESS_EVALUATION_CADENCE_DAYS = 7;

export type RecordWeightAndEvaluateResult = {
  entry: WeightEntry;
  evaluationTriggered: boolean;
};

type RecordWeightService = Pick<RecordWeightEntryService, "execute">;
type NutritionPlanReader = Pick<
  NutritionPlanRepository,
  "findLatestByUserId"
>;
type ProgressEvaluationReader = Pick<
  ProgressEvaluationRepository,
  "findLatestByPlanVersionId"
>;
type ProgressEvaluator = Pick<
  EvaluateAndRecordProgressService,
  "execute"
>;

export class RecordWeightAndEvaluateService {
  constructor(
    private readonly recordWeightService: RecordWeightService,
    private readonly nutritionPlanRepository: NutritionPlanReader,
    private readonly evaluationRepository: ProgressEvaluationReader,
    private readonly evaluateAndRecordProgressService: ProgressEvaluator,
  ) {}

  async execute(
    userId: string,
    entry: NewWeightEntry,
  ): Promise<RecordWeightAndEvaluateResult> {
    const savedEntry = await this.recordWeightService.execute(userId, entry);

    const currentPlan =
      await this.nutritionPlanRepository.findLatestByUserId(userId);

    if (!currentPlan) {
      return {
        entry: savedEntry,
        evaluationTriggered: false,
      };
    }

    const latestEvaluation =
      await this.evaluationRepository.findLatestByPlanVersionId(
        userId,
        currentPlan.id,
      );

    if (latestEvaluation) {
      const evaluatedAt = new Date(latestEvaluation.evaluatedAt).getTime();
      const now = Date.now();
      const cadenceMs =
        PROGRESS_EVALUATION_CADENCE_DAYS * 24 * 60 * 60 * 1000;

      if (now - evaluatedAt < cadenceMs) {
        return {
          entry: savedEntry,
          evaluationTriggered: false,
        };
      }
    }

    await this.evaluateAndRecordProgressService.execute(userId);

    return {
      entry: savedEntry,
      evaluationTriggered: true,
    };
  }
}
