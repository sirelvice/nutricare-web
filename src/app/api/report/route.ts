import { NextResponse } from "next/server";
import { internalServerError, notFound, unauthorized } from "@/lib/api/errors";
import { auth } from "@/auth";
import { PrismaProfileRepository } from "@/lib/profile/repositories/prisma-profile-repository";
import { PrismaWeightRepository } from "@/lib/tracking/repositories/prisma-weight-repository";
import { prismaNutritionPlanRepository } from "@/lib/nutrition-plan/prisma-repository";
import { prisma } from "@/lib/db";
import { GetReportService } from "@/lib/report/service";
import { GetCurrentProgressService } from "@/lib/progress/get-current-progress-service";
import { PrismaProgressEvaluationRepository } from "@/lib/progress/repositories/prisma-progress-evaluation-repository";

export const dynamic = "force-dynamic";

const reportService = new GetReportService(
  new PrismaProfileRepository(prisma),
  new PrismaWeightRepository(prisma),
  prismaNutritionPlanRepository,
  new GetCurrentProgressService(
    prismaNutritionPlanRepository,
    new PrismaProgressEvaluationRepository(prisma),
  ),
);

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return unauthorized();
    }

    const report = await reportService.execute(session.user.id);

    if (!report) {
      return notFound("Profile not found");
    }

    return NextResponse.json(report, {
      status: 200,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("GET /api/report failed", error);

    return internalServerError("Unable to generate report");
  }
}
