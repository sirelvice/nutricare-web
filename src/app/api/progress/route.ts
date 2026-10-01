import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { GetCurrentProgressService } from "@/lib/progress/get-current-progress-service";
import { PrismaProgressEvaluationRepository } from "@/lib/progress/repositories/prisma-progress-evaluation-repository";
import { prismaNutritionPlanRepository } from "@/lib/nutrition-plan/prisma-repository";
import {
  unauthorized,
  notFound,
  internalServerError,
} from "@/lib/api/errors";

const progressService = new GetCurrentProgressService(
  prismaNutritionPlanRepository,
  new PrismaProgressEvaluationRepository(prisma),
);

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return unauthorized();
    }

    const progress = await progressService.execute(session.user.id);

    if (!progress) {
      return notFound("Current progress is not available");
    }

    return NextResponse.json({ progress }, { status: 200 });
  } catch (error) {
    console.error("GET /api/progress failed", error);

    return internalServerError("Unable to load current progress");
  }
}
