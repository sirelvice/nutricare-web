import type { NutritionPlanRepository } from "@/lib/nutrition-plan/repository";
import {
  calculateNutritionPlan,
  type NutritionPlanCalculation,
} from "@/lib/nutrition-plan/calculation-service";
import type { NutritionPlan } from "@/lib/nutrition-plan/domain";
import type { ProfileRepository } from "@/lib/profile/repositories/profile-repository";
import type { WeightRepository } from "@/lib/tracking/repositories/weight-repository";
import type { ProgressEvaluationRepository } from "./repositories/progress-evaluation-repository";
import type { AdjustmentWorkflowRepository } from "./repositories/adjustment-workflow-repository";

export type ApplyPlanAdjustmentResult = {
  plan: NutritionPlan;
  evaluationId: string;
  adjustmentDecision: "ACCEPTED";
  respondedAt: string;
};

export class ApplyPlanAdjustmentService {
  constructor(
    private readonly evaluationRepository: ProgressEvaluationRepository,
    private readonly nutritionPlanRepository: NutritionPlanRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly weightRepository: WeightRepository,
    private readonly adjustmentWorkflowRepository: AdjustmentWorkflowRepository,
  ) {}

  async execute(
    userId: string,
    evaluationId: string,
  ): Promise<ApplyPlanAdjustmentResult> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!evaluationId) {
      throw new Error("Evaluation ID is required");
    }

    const evaluation = await this.evaluationRepository.findById(
      userId,
      evaluationId,
    );

    if (!evaluation) {
      throw new Error("Progress evaluation not found");
    }

    if (evaluation.recommendedAction !== "CONSIDER_ADJUSTMENT") {
      throw new Error("Adjustment response is not applicable");
    }

    if (evaluation.adjustmentDecision !== "PENDING") {
      throw new Error("Adjustment decision has already been recorded");
    }

    const currentPlan =
      await this.nutritionPlanRepository.findLatestByUserId(userId);

    if (!currentPlan || currentPlan.id !== evaluation.planVersionId) {
      throw new Error("Nutrition plan has changed since the recommendation");
    }

    const profile = await this.profileRepository.findByUserId(userId);

    if (!profile) {
      throw new Error("Profile not found");
    }

    const latestWeight =
      await this.weightRepository.findLatestByUserId(userId);

    if (!latestWeight) {
      throw new Error("Weight entry is required to adjust the plan");
    }

    const calculation: NutritionPlanCalculation | null =
      calculateNutritionPlan({
        profile,
        weightKg: latestWeight.weightKg,
      });

    if (!calculation) {
      throw new Error("Unable to calculate adjusted nutrition plan");
    }

    return this.adjustmentWorkflowRepository.applyAcceptedAdjustment(
      userId,
      evaluationId,
      currentPlan.id,
      calculation,
    );
  }
}
