import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  assertSameOrigin,
  InvalidRequestOriginError,
} from "@/lib/security/origin";
import { prisma } from "@/lib/db";
import { prismaNutritionPlanRepository } from "@/lib/nutrition-plan/prisma-repository";
import { PrismaProfileRepository } from "@/lib/profile/repositories/prisma-profile-repository";
import { PrismaWeightRepository } from "@/lib/tracking/repositories/prisma-weight-repository";
import { ApplyPlanAdjustmentService } from "@/lib/progress/apply-plan-adjustment-service";
import { RespondToAdjustmentService } from "@/lib/progress/respond-to-adjustment-service";
import { PrismaAdjustmentWorkflowRepository } from "@/lib/progress/repositories/adjustment-workflow-repository";
import { PrismaProgressEvaluationRepository } from "@/lib/progress/repositories/prisma-progress-evaluation-repository";

const respondToAdjustmentSchema = z.object({
  evaluationId: z.string().min(1),
  decision: z.enum(["ACCEPTED", "DECLINED"]),
});

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    try {
      assertSameOrigin(req);
    } catch (error) {
      if (error instanceof InvalidRequestOriginError) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 },
        );
      }

      throw error;
    }

    const body = await req.json().catch(() => null);
    const parsed = respondToAdjustmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid adjustment response." },
        { status: 400 },
      );
    }

    const userId = session.user.id;
    const evaluationRepository = new PrismaProgressEvaluationRepository(prisma);

    if (parsed.data.decision === "DECLINED") {
      const service = new RespondToAdjustmentService(
        evaluationRepository,
      );

      const evaluation = await service.execute(userId, parsed.data);

      return NextResponse.json(
        {
          evaluationId: evaluation.id,
          adjustmentDecision: evaluation.adjustmentDecision,
          respondedAt: evaluation.respondedAt,
        },
        { status: 200 },
      );
    }

    const service = new ApplyPlanAdjustmentService(
      evaluationRepository,
      prismaNutritionPlanRepository,
      new PrismaProfileRepository(prisma),
      new PrismaWeightRepository(prisma),
      new PrismaAdjustmentWorkflowRepository(prisma),
    );

    const result = await service.execute(
      userId,
      parsed.data.evaluationId,
    );

    return NextResponse.json(
      {
        evaluationId: result.evaluationId,
        adjustmentDecision: result.adjustmentDecision,
        respondedAt: result.respondedAt,
        plan: result.plan,
      },
      { status: 200 },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "Progress evaluation not found",
        "Adjustment response is not applicable",
        "Adjustment decision has already been recorded",
        "Nutrition plan has changed since the recommendation",
        "Adjustment recommendation is no longer applicable",
        "Adjustment decision could not be recorded",
      ].includes(error.message)
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 },
      );
    }

    console.error("POST /api/progress/adjustment failed", error);

    return NextResponse.json(
      { error: "Unable to process adjustment response." },
      { status: 500 },
    );
  }
}
