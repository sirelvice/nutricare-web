import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prismaNutritionPlanRepository } from "@/lib/nutrition-plan/prisma-repository";
import { GetNutritionPlanHistoryService } from "@/lib/nutrition-plan/service";
import {
  unauthorized,
  internalServerError,
} from "@/lib/api/errors";

const historyService = new GetNutritionPlanHistoryService(
  prismaNutritionPlanRepository,
);

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return unauthorized();
    }

    const plans = await historyService.execute(session.user.id);

    return NextResponse.json({ plans }, { status: 200 });
  } catch (error) {
    console.error("GET /api/nutrition-plan/history failed", error);

    return internalServerError("Unable to load nutrition plan history");
  }
}
