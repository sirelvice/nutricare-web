import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { GetRecommendationsService } from "@/lib/reco/service";
import { PrismaProfileRepository } from "@/lib/profile/repositories/prisma-profile-repository";
import { PrismaWeightRepository } from "@/lib/tracking/repositories/prisma-weight-repository";
import { prismaNutritionPlanRepository } from "@/lib/nutrition-plan/prisma-repository";

const recommendationsService = new GetRecommendationsService(
  new PrismaProfileRepository(prisma),
  new PrismaWeightRepository(prisma),
  prismaNutritionPlanRepository,
);

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recommendations = await recommendationsService.execute(
      session.user.id,
    );

    if (!recommendations) {
      return NextResponse.json(
        {
          error:
            "Profile, current weight, and nutrition plan are required to generate recommendations",
        },
        { status: 422 },
      );
    }

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("GET /api/recommendations failed", error);

    return NextResponse.json(
      { error: "Unable to load recommendations" },
      { status: 500 },
    );
  }
}
