import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaProfileRepository } from "@/lib/profile/repositories/prisma-profile-repository";
import { PrismaWeightRepository } from "@/lib/tracking/repositories/prisma-weight-repository";
import { prisma } from "@/lib/db";
import { GetCurrentProgressService } from "@/lib/progress/get-current-progress-service";
import { PrismaProgressEvaluationRepository } from "@/lib/progress/repositories/prisma-progress-evaluation-repository";
import { prismaNutritionPlanRepository } from "@/lib/nutrition-plan/prisma-repository";

const progressService = new GetCurrentProgressService(
  prismaNutritionPlanRepository,
  new PrismaProgressEvaluationRepository(prisma),
);

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const progress = await progressService.execute(session.user.id);

    if (!progress) {
      return NextResponse.json(
        { error: "Current progress is not available" },
        { status: 404 },
      );
    }

    return NextResponse.json({ progress }, { status: 200 });
  } catch (error) {
    console.error("GET /api/progress failed", error);

    return NextResponse.json(
      { error: "Unable to load current progress" },
      { status: 500 },
    );
  }
}
