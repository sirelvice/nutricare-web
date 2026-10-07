import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { RecommendationContextError } from "@/lib/reco/context-error";
import { RecommendationEligibilityError } from "@/lib/reco/eligibility";
import { GetRecommendationsService } from "@/lib/reco/service";
import { PrismaProfileRepository } from "@/lib/profile/repositories/prisma-profile-repository";
import { PrismaWeightRepository } from "@/lib/tracking/repositories/prisma-weight-repository";
import { prismaNutritionPlanRepository } from "@/lib/nutrition-plan/prisma-repository";
import {
  unauthorized,
  internalServerError,
} from "@/lib/api/errors";

const recommendationsService = new GetRecommendationsService(
  new PrismaProfileRepository(prisma),
  new PrismaWeightRepository(prisma),
  prismaNutritionPlanRepository,
);

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return unauthorized();
    }

    const recommendations = await recommendationsService.execute(
      session.user.id,
    );

    if (!recommendations) {
      return NextResponse.json({
        error: "Profile, current weight, and nutrition plan are required to generate recommendations",
        code: "RECOMMENDATIONS_SETUP_REQUIRED",
      }, { status: 422, headers: { "Cache-Control": "private, no-store" } });
    }

    return NextResponse.json(recommendations, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof RecommendationContextError) {
      return NextResponse.json({ error: error.message, code: error.code }, {
        status: 409, headers: { "Cache-Control": "private, no-store" },
      });
    }
    if (error instanceof RecommendationEligibilityError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 422, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    console.error("GET /api/recommendations failed", error);

    return internalServerError("Unable to load recommendations");
  }
}
